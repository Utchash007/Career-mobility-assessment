# Frontend — component-first interface

**Latest deployment/auth/UI follow-up:** the user interrupted the build and requested
no further tests or builds. Docker packaging, standalone/request-time configuration,
session-status compatibility and avatar placement are source-reviewed only; earlier
results below do not verify those edits or a completed build of the redirect change.
Configuration inspection then found that both local backend origin lists allowed
127.0.0.1:3000 but excluded localhost:3000. The ignored root `.env` now allows both
loopback origins, without changing credentials. Restart the backend to reload it;
no tests, builds or live authentication requests were run for this configuration fix.

**Phases 1–9 are implemented; Phase 10 credential-free checks pass.** The Next.js App
Router frontend includes manual API contracts, Zod validation, profile conversion,
strict query helpers and a palette-themed, component-first application shell.
`/` now requires sign-in and renders the dashboard. App-branded Clerk prebuilt
sign-in/up screens, a session boundary and typed authenticated API adapters are wired.
`/profile` now reads and replaces a complete profile, with a deliberately confirmed
fictional sample action. Opportunities, ranked matches, details, shortlist/notes and
application-data deletion are implemented; no live integration has been tested.
`GET /api/health` still returns `{"status":"ok"}`; it checks neither the backend
nor external services.

Phase 1 was pushed to `origin/Frontend` as `33317a1`. Phases 2–10 are separate
commits on the same `Frontend` branch, which is also the Docker deployment branch;
`main` is not merged or changed by this follow-up. Browser interactions and live
Clerk/persistence/isolation/deletion still require separately approved verification.
The auth-presentation follow-up provides a compact centered card matching
the supplied reference, account-oriented copy and a user-safe unavailable screen.

## Routes and data flow

| Route | Purpose |
| --- | --- |
| `/` | Protected dashboard with backend totals and top matches |
| `/profile` | Protected complete profile/sample workflow |
| `/opportunities` | Protected browsing; no saved profile required |
| `/opportunities/[id]` | Protected full requirements and independent fit panel |
| `/recommendations` | Protected ranked matches, labeled **Matches** |
| `/shortlist` | Protected saved opportunities and private notes |
| `/account` | Protected application-data deletion; Clerk identity stays separate |
| `/sign-in`, `/sign-up` | Public Clerk catch-all authentication screens |
| `/setup` | Public sign-in-unavailable screen when authentication cannot be initialized |
| `/api/health` | Public Next liveness, not backend/database readiness |

Initial reads run in Server Components through the typed FastAPI client. Interactive
mutations run directly from the browser to FastAPI using ordinary Clerk bearer
session tokens, then refresh affected Server Components. Next adds no business API,
database connection, matching engine or custom login/token endpoint. FastAPI verifies
identity and owns user authorization, persistence, scores, ranking and totals.

## Component architecture

Every app-owned React component must use a same-named folder and file:

```text
components/OpportunityCard/OpportunityCard.tsx
components/ProfileForm/ProfileForm.tsx
components/ProfileScreen/ProfileScreen.tsx
```

Create the folder when implementing the component, not as an empty placeholder.
Build meaningful leaves first, then compose forms/cards/lists and screen components.
Use typed props, a single nearest state owner, and callbacks; do not define
components inside other components or add an app-wide store by default.

Next's `page.tsx` files are thin adapters: authentication, metadata and route props
only, followed by an imported screen. No inline forms, cards, lists, state or
helper components. Layouts similarly delegate to imported shell/provider components,
apart from the root HTML/body wrapper required by Next.js. No separate Pages Router.

Flowbite supplies UI primitives; Clerk supplies authentication UI. App-owned
components compose them rather than replacing them with another UI kit.
Import local component files directly, not through a global components barrel.
Server Components are the default; interactive subtrees alone use `"use client"`.

### Foundation modules

| Directory | Responsibility |
| --- | --- |
| `lib/contracts/` | Manual DTOs, enums, ISO codes, endpoint paths and runtime schemas |
| `lib/forms/` | Input normalization, profile drafts and dotted validation errors |
| `lib/queries/` | Exact collection URL parsing, serialization and filter application |
| `lib/display/` | Labels, Clerk display-name fallback and theme colors; no JSX |
| `lib/api/`, `hooks/useApi.ts` | Allowlisted no-store transport, server reads and session-scoped browser requests |
| `tests/fixtures/` | Fictional in-memory contract examples, never runtime identities |

Contracts follow the implemented backend schemas, not obsolete design examples.
Writes reject extra fields and produce a complete replacement snapshot. The draft
does not contain an editable name: conversion takes the current Clerk display name
separately and never sends server-owned fields or language-row IDs. Preserve null
versus explicit zero/false, and empty collections versus null. Birthday remains
an optional date-only value with a UTC-today bound, never a matching criterion.

Common queries default to page 1, size 10 (maximum 100). Supplied blank, duplicate
and unsupported URL parameters fail. Blank form filters are omitted when applying
them, and applying filters/page size resets the page to 1. Matches accept no `sort`.
IDs and numeric metadata must fit JavaScript's safe-integer range. The backend
alone computes scores, eligibility, ordering and totals; these modules do not score.
Evidence remains `Record<string, unknown>` until presentation narrows its shape.

### Shared UI and shell

Every name below uses `components/<Name>/<Name>.tsx`:

| Components | Responsibility |
| --- | --- |
| `LoadingState`, `EmptyState` | Labeled loading and explanatory empty results with composed actions |
| `ErrorState` | Fixed safe error copy and an optional controlled retry action |
| `ProfileRequiredState` | Missing-profile state, distinct from zero results |
| `ConfigurationNotice` | Kind-based setup guidance; no environment-value props |
| `ConfirmationDialog` | Controlled Flowbite modal with cancel-first focus and pending guards |
| `NavigationMenu`, `AppNavigation` | Active links, responsive menu and optional account-content slot |
| `LinkButton` | Client-side Flowbite/NextLink adapter; only serializable props cross from server screens |
| `AppShell`, `AppProviders` | Landmarks/skip link, page children and initialized Flowbite theme |
| `AuthLayout` | Compact centered sign-in/up/unavailable card and app mark; no auth logic or credential inputs |
| `NotFoundScreen` | Safe unknown-route/resource presentation with a fixed internal home link |
| `WorkflowPreviewCard`, `HomeScreen` | Retained earlier-phase static overview, not exposed as an active route |

The root layout composes providers inside required HTML/body tags; the `(app)`
layout composes the protected shell. Page, loading, error and not-found entrypoints delegate to the matching
components. Server-rendered shell/content stays outside the client provider's
import graph and is passed through `children`. Navigation/link adapters, controlled
forms, session handling, feedback actions and providers are explicit client boundaries.
The route error adapter uses Next 16.4's stable `retry()` callback for refetching
recovery rather than the non-refetching `reset()` callback. These boundaries were
reviewed against the installed Next.js `dist/docs/` guides, not older tutorials.

`lib/display/navigation.ts` defines fixed internal destinations. Dashboard, Profile,
Opportunities, Matches (`/recommendations`), Shortlist and Account are enabled.
Availability is not an authorization mechanism. Every protected page checks Clerk
authorization independently; backend resource authorization remains authoritative.
The menu reads Flowbite's own state for `aria-expanded`/`aria-controls`; it does
not maintain a second copy. Desktop navigation begins at the `lg` breakpoint.

Dialog open/pending state and mutation behavior belong to the caller. Pending
disables both actions and dismissal; the shared dialog never performs requests.
`ErrorState` accepts an error reason, not an exception or server message. Supply
retry only for an explicitly safe action, not automatic mutation replay.

### Profile workflow

Controlled identity, education, experience, skills, language, preferences and
work-authorisation leaves compose `ProfileForm`; `ProfileScreen` performs server reads.
The form owns one draft and saved baseline. It does not reset on background refresh,
autosave, store drafts in the browser or mutate data on mount. Errors preserve edits;
dotted backend errors focus the related field. Language rows have stable draft IDs.
All supported country/language choices remain editable, not just suggested countries.
Sample replacement confirms both saved data and unsaved edits, then calls the backend.
It does not create/change Clerk identity or clear the shortlist. Personal saves use
the Clerk name; a different saved/sample name is identified explicitly.
Ambiguous write outcomes block another write until the user reloads saved state.
Runtime form behavior, focus and actual persistence remain unverified.

### Opportunity discovery

`OpportunityMeta` and `OpportunityCard` render backend data. Common controlled
`CollectionFilters` compose endpoint-specific controls; applied filters live only
in the URL. Apply resets page 1; pagination preserves validated filters. Reload and
back/forward navigation reconstruct the applied search. Invalid URL parameters
receive reset guidance, distinct from zero results or an out-of-range page.
Totals are backend metadata; there is no local filtering or catalog-wide fetch.
Cards link to details and compose the shared shortlist action.

### Ranked matching

`MatchLabelBadge`, `MatchScore`, `EligibilityFlags`, `CriterionRow`,
`MatchBreakdown` and `MatchSummary` consume backend results without scoring.
`RecommendationCard` keeps eligibility findings before the score and derives
strengths/gaps only from backend statuses/reasons. Null is insufficient data, not 0;
criterion scores remain 0–1 and overall fit 0–100. Evidence is narrowed per criterion;
unknown arbitrary objects are omitted, never stringified into the interface.
`/recommendations` preserves server ranking/totals, offers label/common URL filters
and handles missing profile separately from zero results. No per-card requests.

### Opportunity detail

`/opportunities/[id]` validates positive safe IDs and shows full required/preferred
skills, education, languages and stated eligibility rules. Description is plain text.
Opportunity/profile reads start concurrently; match follows only profile existence.
Missing/deleted profile or unavailable matching does not hide available role data.
`MatchPanel` reuses the full five-criterion breakdown and visible eligibility flags.
Back links preserve only validated known collection context, never arbitrary return URLs.

### Shortlist and private notes

`ShortlistAction` is shared across browsing, matches, detail and saved cards.
Adds send `{}`, preserving existing notes; removes confirm and handle no-body 204.
Current-item optimism rolls back definite failures; uncertain writes require an explicit
saved-state read. A confirmed write with failed refetch stays confirmed, not rolled back.
`ShortlistNoteEditor` owns a dirty draft with explicit Save; empty string clears and
500 counts Unicode characters. Dirty notes survive background refresh, and stale
server props cannot undo a confirmed note-save response. Missing rows
are recoverable, never automatically recreated. Note reconciliation uses bounded
current-user list reads because the backend has no single-item shortlist GET.
Same-item note/toggle operations serialize; deletion reserves an exclusive session
operation. `/shortlist` uses backend filters/totals and repairs disappeared last pages.

### Dashboard and privacy

Dashboard reads independent totals concurrently and reuses match cards. Failed
services are not displayed as zero counts. Profile summary excludes birthday.
`/account` separates Clerk identity controls from application-data deletion.
Deletion is explicitly confirmed and session-exclusive, sends no body and validates
the application-only response. Confirmed success loads a fresh `/profile` document
to discard all React drafts/router caches while keeping Clerk signed in. Failure or
timeout never claims deletion. This action is never run on mount.
Unsaved profile/note edits warn on document unload; in-app navigation has no custom
blocking router. Background refresh does not erase dirty drafts.

## Color scheme

Requested [Color Hunt palette](https://colorhunt.co/palette/efece38fabd44a70a9000000):

| Color | Use |
| --- | --- |
| `#EFECE3` | Cream canvas and action text |
| `#8FABD4` | Soft blue surfaces, selection and secondary accents |
| `#4A70A9` | Brand accents and decorative emphasis |
| `#000000` | Primary text |

Tailwind tokens live in `app/globals.css`; matching color constants live in
`lib/display/palette.ts`. Use the darker derived blue `#38547F` for small-text
actions/links and `#2D4366` for hover rather than assuming the base blue works for
all normal-text pairs. Semantic critical/verification/success colors stay distinct
and must accompany text, never color alone. Keep light mode.
`lib/display/flowbite-theme.ts` now applies static palette-token classes to
Flowbite buttons, inputs/selects/textareas, alerts, cards, progress, spinner, modal
and navigation through the providers.
Overridden leaves replace the corresponding defaults; other Flowbite defaults remain.
Clerk's appearance uses the same palette through `lib/display/clerk-appearance.ts`.
Auth-only card, input and action overrides use Clerk's built-in simple theme and
the `clerk` CSS layer before Tailwind utilities. The outer frame owns the small
app mark and single border; the embedded form is flush, with stacked social buttons
above the email/identifier field, compact controls and a black primary action.
Initial Clerk headings are localized rather than duplicated outside the widget.
Verification headings, recovery
actions, enabled authentication methods and Clerk branding are not hidden.
Styling is not verified accessibility.

## Toolchain and installation

Recommended runtime: **Node 24.22.3 LTS**, recorded in `.node-version`, `.nvmrc`
and `package.json` engines. Use **npm 11.20.0**. Select Node with your existing
version manager; this project does not install or change global Node.

On Windows, an `npm.cmd` beside another `node.exe` may select that executable despite
PATH changes. Confirm both `node --version` and `npm exec --offline -c "node --version"`.
Phase 10 explicitly invoked npm's CLI with the standalone Node 24 executable and
confirmed the child runtime, then repeated all checks from a fresh source snapshot.

From `Frontend/`:

The commands below passed in credential-free snapshots during Phase 10, except
the development command here is the normal configured application launch.

```sh
npm ci --strict-peer-deps --ignore-scripts
npm test
npm run typecheck
npm run lint
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/` for the dashboard or `/api/health` for frontend liveness.
Stop with Ctrl+C. To run the production
build instead:

```sh
npm run start -- --hostname 127.0.0.1 --port 3000
```

Commit `package-lock.json` and use `npm ci` for repeatable installations. `.npmrc`
keeps strict peer resolution and disables dependency lifecycle scripts. No
`--force` or `--legacy-peer-deps` is needed. If another platform requires a native
package's lifecycle script, review that package specifically before enabling it;
do not enable all install scripts blindly.

## Configuration and boundaries

- `next.config.ts`: Cache Components and React Compiler explicitly disabled;
  Flowbite's Next plugin enables import optimization and generates its style list.
  `agentRules: false` prevents dev startup from creating extra agent documents.
- `postcss.config.mjs` / `app/globals.css`: Tailwind v4 and Flowbite's published
  CSS plus the user-requested palette and base styles; no Tailwind v3 configuration.
- `.flowbite-react/config.json`: automatic import detection, Tailwind v4, and
  dark mode off. `path: "components"` is an unused component-generator setting, not an
  instruction to generate components. Do not run Flowbite component/project
  generators. Create authored component folders manually. Configuration was set up
  manually from the installed package; no generator was run.
- The Flowbite plugin regenerates `.flowbite-react/class-list.json` and
  `.flowbite-react/init.tsx` during build/dev. They are ignored build artifacts;
  `FlowbiteProvider` imports the generated `ThemeInit` and renders it before child UI
  to synchronize the light-mode/Tailwind-v4 configuration. Do not edit or move
  generated files, or publish them as app-owned components. Fresh-checkout generation
  passed without the previous missing-initialization warning.
  The schema URL is upstream-enforced, not a dependency version choice.
- `biome.json`: linting/formatting with generated output and local Markdown excluded.
  Frontend `.gitattributes` keeps LF line endings stable on Windows. `npm run format`
  formats authored files. `npm run typecheck` generates Next's route types before
  running strict TypeScript checks, so it also works before a first build.
- `tsconfig.json`: `@/*` resolves project-local imports. Explicit `.ts` imports are
  allowed for pure modules so Node 24's native type stripping can run the `.mjs`
  contract tests without a new test runner. Static rendering tests use the installed
  TypeScript compiler through a test-only TSX/alias loader; it adds no runtime auth
  bypass or dependencies. No runtime TypeScript enum/decorator features are used.
- `app/layout.tsx`: metadata and HTML/body containing imported providers/shell.

### Environment and authentication

Missing Clerk configuration shows a branded sign-in-unavailable screen at `/setup`,
never a private fixture screen, pretend login form or API-key instructions for users.
Its retry link performs a full-page reload. Configuration instructions belong in
this developer README, not the account sign-in UI.
Keep shared credentials in the repository root `.env`. Next.js first
loads `Frontend/.env*` in its normal precedence order; `next.config.ts` then loads the
root `.env` for missing values only, using Node's dotenv parser. Real environment
variables and frontend-local values take precedence per key. Root lookup is anchored
to `load-root-env.mjs`, not the terminal's working directory. A missing root file is allowed.

Required variables for private workflows are `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
and server-only `CLERK_SECRET_KEY`. `JWKS_PUBLIC_KEY` is
backend-only verification configuration. All `.env*` files, including example templates,
are excluded from Git. Never expose database credentials, the secret key or JWKS
configuration through `NEXT_PUBLIC_` variables or Next.js's `env` configuration.
Public variables are inlined at build time when referenced; rebuild after changing them.

Clerk is wired through the server-owned `AppProviders`; `FlowbiteProvider` owns
client theme initialization. Each protected page calls `await auth.protect()`.
The proxy initializes `clerkMiddleware()` with explicit `signInUrl: "/sign-in"`
and `signUpUrl: "/sign-up"`, without a route-protection handler, and otherwise
rewrites to the unavailable screen. Keyless auto-provisioning is disabled; no Clerk CLI,
instance creation, provider-settings changes or identity creation were performed.
Catch-all `/sign-in` and `/sign-up` routes use Clerk's prebuilt UI inside `AuthLayout`,
with labeled loading fallbacks. Users sign in with their accounts; they never enter
Clerk application keys. Available methods follow the existing Clerk instance settings;
styling does not enable password/social login or change those settings.
Google, Microsoft and Apple buttons only appear when enabled in the Clerk instance;
there are no decorative OAuth buttons or invented terms/privacy URLs. All subsequent
password, recovery, verification and MFA headings/actions keep their original meaning.
The server redirect URLs must be configured separately from `ClerkProvider` props:
provider-only configuration lets `auth.protect()` and `auth().redirectToSignIn()`
fall back to Clerk's hosted Account Portal. Explicit relative middleware URLs keep
entry-point/session-recovery redirects on the current app origin and preserve the
requested destination. No new credentials or dashboard changes are needed for this
routing fix. Restart the frontend and return to its local URL if a browser is already
on the hosted portal; the open hosted tab cannot pick up local code changes.

API base configuration must be an HTTPS origin (HTTP allowed only for local loopback),
without credentials, query, hash or a path prefix. Example: `http://127.0.0.1:8000`.
The backend's `CORS_ORIGINS` and `CLERK_AUTHORIZED_PARTIES` must allow the
exact frontend origin; `localhost` and `127.0.0.1` are different origins.
For local development with either address, set both to
`["http://127.0.0.1:3000","http://localhost:3000"]` and restart the backend.
Changing `.env` alone does not refresh the running backend's cached settings.
The Clerk session token's custom `publicMetadata.role` claim is not used by this
backend and cannot fix a rejected authorized party. Do not set all users to admin
to troubleshoot sign-in; no custom role claim or JWT template is required.
Use the existing backend environment-name guidance; do not expose backend credentials.
Ordinary session tokens are acquired per request, never from a custom JWT template.
Server reads and browser mutations share response validation, a 15-second timeout,
abort handling, no-store caching and redirect rejection. There is no duplicate Next
business API/BFF, automatic mutation retry or persistent token/profile storage.
401 offers session recovery; 503 remains unavailable, not an empty success.
Session changes hide stale server children, remount client drafts and abort old requests.
Browser interaction and live identity isolation remain unverified.

## Render Docker service

Use `Frontend/Dockerfile` with Root Directory `Frontend`, Dockerfile Path
`./Dockerfile`, Docker Build Context `.` and branch `Frontend`. Leave Docker Command
empty and set Health Check Path to `/api/health`. The production image runs the
standalone Next.js server as the non-root `node` user, binds to `0.0.0.0`, and uses
Render's `PORT` (default `10000`). No Compose or startup script is needed.

Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
in this service's Render Environment settings. The first two public values are the
only declared build arguments; set them before building. Render also supplies all
configured variables at runtime. Do not declare a `CLERK_SECRET_KEY` build argument
or copy an environment file into the image. `.dockerignore` excludes local secrets,
dependencies, caches, tests and non-README Markdown from the build context.

`next.config.ts` uses `output: "standalone"`; the final image copies only its traced
server files, static assets and the public directory. `app/layout.tsx` forces
request-time rendering so building without Clerk's secret cannot cache an
unconfigured provider or require secret credentials during prerendering. Local
root `.env` fallback still works outside Docker; no environment file is included
in Render images. Rebuild after changing either public value, not just restart.

Use the backend's public HTTPS origin for `NEXT_PUBLIC_API_URL`, without an API
path prefix. Match both backend origin lists to the actual deployed frontend URL.
See the root README for the two-service settings and backend environment table.
No Docker build, runtime probe, tests or live authentication calls were performed
for this packaging change.

## Exact dependency pins

| Runtime package      | Version |
| -------------------- | ------- |
| `next`               | 16.4.6  |
| `react`, `react-dom` | 19.3.1  |
| `flowbite-react`     | 0.12.17 |
| `@clerk/nextjs`      | 7.10.4  |
| `zod`                | 4.6.7   |

| Development package                   | Version |
| ------------------------------------- | ------- |
| `@biomejs/biome`                      | 2.6.8   |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.5   |
| `postcss`                             | 8.5.33  |
| `typescript`                          | 5.9.3   |
| `@types/react`, `@types/react-dom`    | 19.3.0  |
| `@types/node`                         | 24.19.2 |

Zod validates external data and complete write snapshots. Live Clerk sessions remain
unverified. **`openapi-typescript` is deliberately excluded.** No new renderer, runner,
browser dependencies, ESLint or other UI kit were installed during implementation.

### Scoped security override

`package.json` overrides only Flowbite React's `deepmerge-ts` dependency to
**8.0.2**, replacing the vulnerable upstream 7.1.5 pin described in the local
`FRONTEND_DEPENDENCY_REVIEW.md`. This crosses a **major-version boundary** and
is not an upstream-supported combination. Phase 10 static React/Flowbite rendering,
theme merging and compilation pass; interactive provider/hydration behavior remains
unverified. Keep the caveat explicit, verify browser interactions separately, and
remove the override only after an upstream patched Flowbite release is reviewed.
There is no direct `deepmerge-ts` dependency or global PostCSS override.

Check current advisories with:

```sh
npm audit
npm audit --omit=dev
npm ls --all
```

Zero npm findings are a point-in-time dependency result, not an application
security guarantee. Browser authentication/interactions, live user isolation and
deployment security remain unverified.

## Implementation verification status

Verified on **19 November 2026, Windows x64, Node 24.22.3 / npm 11.20.0** in
credential-free source snapshots with no root/project environment files or live
application configuration. Global Node and original environment files were untouched.

| Check | Result |
| --- | --- |
| Strict locked `npm ci --strict-peer-deps --ignore-scripts` | Passed; no peer/engine warning or lifecycle scripts |
| `npm test` | **102 passed**; pure contracts/state/transport, source architecture, offline Clerk redirect construction and nine static React/Flowbite rendering cases |
| `npm run typecheck` | Passed, including generated Next route types |
| `npm run lint` | Passed; authored source formatted, generated output/Markdown excluded |
| `npm run build` | Passed with all documented routes and proxy |
| `npm audit --json`, `npm audit --omit=dev --json` | **0 vulnerabilities** each |
| `npm ls --all` | Exit 0; platform-specific missing optional packages are expected |
| Dev + production loopback HTTP probes | Public health 200; eleven URLs each safely rewrote to the user-safe unavailable screen with 200 and no tested fixture data or developer key instructions |

`scripts/probe-runtime.mjs` refuses source directories containing `.env*` or a
process containing application configuration. Run it **only in a credential-free
snapshot** after building, with `node scripts/probe-runtime.mjs production` and
`node scripts/probe-runtime.mjs dev`; it starts/stops its own servers on 3211/3210.
These are setup/health probes, not proof of protected routes with Clerk configured.
The auth-presentation follow-up repeated tests, lint, typecheck, build and both
runtime probes in a credential-free snapshot using copied existing dependencies.
No dependency installation/download, live identity requests or environment edits
were made. Locked-install, dependency-tree and audit results above remain the
unchanged Phase 10 baseline.
`tests/auth-redirect.test.mjs` exercises the installed Clerk SDK URL builder with
the actual configured middleware paths and a fictional public key, with network
requests forbidden. It checks both auth routes and return destinations on localhost,
127.0.0.1 and a fictional HTTPS deployment origin. It is not a live session/sign-in test.

Static rendering uses actual pinned React/Flowbite packages without a DOM/browser.
It checks zero/null progress, ARIA bounds, palette output, all labels, critical flags,
escaped text, criterion evidence, requirements, global remote and birthday omission.
The added auth cases check the shared frame and user-safe unavailable/retry markup,
not an initialized Clerk widget or successful account login.
Finalized fictional backend headlines are 95.2 strong, 69.0 partial, German-language
68.0 not_recommended and senior-manager 56.0 partial. No frontend scoring is tested
or implemented. Source assertions are not interaction or security proofs.

### Remaining manual/browser and live checks

- Configured signed-out/protected entrypoints, unknown resources and recovery states.
- Keyboard skip link, visible focus, menu expansion and active-route announcements.
- Mobile/desktop layouts, zoom and no horizontal overflow at navigation breakpoints.
- Dialog cancel-first focus, Escape/backdrop, focus return, pending guards and errors.
- Actual generated theme classes, provider synchronization and hydration/console warnings.
- No private data, credentials or raw error details in markup, logs or browser storage.

No DOM interaction runner or browser automation/download was installed or run.
Additional tooling needs separate approval. Real sign-in, profile/sample/save/note,
two-user isolation, concurrency and application-data deletion tests remain blocked
until fresh authorization, an approved test identity/session and a disposable writable
database are supplied. Prior database migration/seed permission does not permit them.

Fixtures create no real Clerk accounts, sessions, database users or profiles.
There is no runtime mock-auth switch. Do not perform live user-data writes or
deletion tests without fresh permission and an approved disposable database and
test identity. Preserve local environment files; never publish credentials,
dependencies, agent folders or non-README planning Markdown.
Frontend-specific planning/review Markdown stays under `Frontend/`, not the
repository root, and remains excluded from publication.

Implemented with AI assistance, informed by the React composition/performance
skills, Clerk/Next.js guidance and the backend contracts. No generated API client.

Earlier scaffold results are superseded by the Phase 10 checks above. Root fallback,
precedence, optional missing files and error propagation are still covered by three
tests using temporary fictional environment values, not the user's credentials.
