# Frontend — component-first interface

**Phases 1–8 are implemented, not yet execution-verified.** The Next.js App
Router frontend includes manual API contracts, Zod validation, profile conversion,
strict query helpers and a palette-themed, component-first application shell.
`/` now requires sign-in and renders a temporary workflow overview. Clerk prebuilt
sign-in/up screens, a session boundary and typed authenticated API adapters are wired.
`/profile` now reads and replaces a complete profile, with a deliberately confirmed
fictional sample action. `/opportunities` adds URL-driven discovery; no live integration has been tested.
`GET /api/health` still returns `{"status":"ok"}`; it checks neither the backend
nor external services.

Phase 1 was pushed to `origin/Frontend` as `33317a1`. Phase 2 is recorded in a
separate implementation commit. Further phases continue with separate commits;
implementation commits are not evidence of passing verification.

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
| `AppShell`, `AppProviders` | Landmarks/skip link, page children and initialized Flowbite theme |
| `NotFoundScreen` | Safe unknown-route/resource presentation with a fixed internal home link |
| `WorkflowPreviewCard`, `HomeScreen` | Static public overview; no account, fixtures or computed results |

The root layout composes providers inside required HTML/body tags; the `(app)`
layout composes the protected shell. Page, loading, error and not-found entrypoints delegate to the matching
components. Server-rendered shell/content stays outside the client provider's
import graph and is passed through `children`. Only menu, retry and dialog
interactions (plus the provider) are explicit client boundaries.
The route error adapter uses Next 16.4's stable `retry()` callback for refetching
recovery rather than the non-refetching `reset()` callback. These boundaries were
reviewed against the installed Next.js `dist/docs/` guides, not older tutorials.

`lib/display/navigation.ts` defines fixed internal destinations. Only Home is
enabled; planned Profile, Opportunities, Matches (`/recommendations`), Shortlist
and Account entries are non-link text marked **Soon**. Availability is not an
authorization mechanism. Later pages must check Clerk authorization independently.
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
Details and shortlist actions follow in later phases.

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
500 counts Unicode characters. Dirty notes survive background refresh. Missing rows
are recoverable, never automatically recreated. Note reconciliation uses bounded
current-user list reads because the backend has no single-item shortlist GET.
Same-item note/toggle operations serialize; deletion reserves an exclusive session
operation. `/shortlist` uses backend filters/totals and repairs disappeared last pages.

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
Flowbite buttons, alerts, cards, spinner, modal and navigation through `AppProviders`.
Overridden leaves replace the corresponding defaults; other Flowbite defaults remain.
Clerk's appearance uses the same palette through `lib/display/clerk-appearance.ts`.
Styling is not verified accessibility.

## Toolchain and installation

Recommended runtime: **Node 24.22.3 LTS**, recorded in `.node-version`, `.nvmrc`
and `package.json` engines. Use **npm 11.20.0**. Select Node with your existing
version manager; this project does not install or change global Node.

From `Frontend/`:

These are setup/final-verification commands, not evidence of Phase 1–2 execution.
Tests, lint, typecheck, builds and runtime probes are currently deferred to Phase 10.

```sh
npm ci --strict-peer-deps --ignore-scripts
npm test
npm run typecheck
npm run lint
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/` for the signed-in overview or `/api/health` for frontend liveness.
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
  `AppProviders` imports the generated `ThemeInit` and renders it before child UI
  to synchronize the light-mode/Tailwind-v4 configuration. Do not edit or move
  generated files, or publish them as app-owned components. Check fresh-checkout
  generation and the absence of initialization warnings during final verification.
  The schema URL is upstream-enforced, not a dependency version choice.
- `biome.json`: linting/formatting with generated output excluded. `npm run format`
  formats authored files. `npm run typecheck` generates Next's route types before
  running strict TypeScript checks, so it also works before a first build.
- `tsconfig.json`: `@/*` resolves project-local imports. Explicit `.ts` imports are
  allowed for pure modules so Node 24's native type stripping can run the `.mjs`
  contract tests without a new test runner or transpiler. No runtime TypeScript
  enum/decorator features are used.
- `app/layout.tsx`: metadata and HTML/body containing imported providers/shell.

### Environment and authentication

Missing Clerk configuration shows `/setup`, never a private fixture screen.
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
The proxy delegates to bare `clerkMiddleware()` when configured and otherwise
rewrites to setup guidance. Keyless auto-provisioning is disabled; no Clerk CLI,
instance creation, provider-settings changes or identity creation were performed.
Catch-all `/sign-in` and `/sign-up` routes use Clerk's prebuilt UI.

API base configuration must be an HTTPS origin (HTTP allowed only for local loopback),
without credentials, query, hash or a path prefix. Example: `http://127.0.0.1:8000`.
The backend's `CORS_ORIGINS` and `CLERK_AUTHORIZED_PARTIES` must allow the
exact frontend origin; `localhost` and `127.0.0.1` are different origins.
Use the existing backend environment-name guidance; do not expose backend credentials.
Ordinary session tokens are acquired per request, never from a custom JWT template.
Server reads and browser mutations share response validation, a 15-second timeout,
abort handling, no-store caching and redirect rejection. There is no duplicate Next
business API/BFF, automatic mutation retry or persistent token/profile storage.
401 offers session recovery; 503 remains unavailable, not an empty success.
Session changes hide stale server children, remount client drafts and abort old requests.
Browser interaction and live identity isolation remain unverified.

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

Zod validates external data and complete write snapshots. Clerk is wired but unverified.
**`openapi-typescript` is deliberately excluded.** Browser/component testing tools
remain a separate approval decision; no additional dependencies, ESLint or other
UI kit were installed for Phases 1–2.

### Scoped security override

`package.json` overrides only Flowbite React's `deepmerge-ts` dependency to
**8.0.2**, replacing the vulnerable upstream 7.1.5 pin described in the local
`FRONTEND_DEPENDENCY_REVIEW.md`. This crosses a **major-version boundary** and
is not an upstream-supported combination. The earlier review tested selected
merge/provider behavior; the scaffold's checks do not validate future interactive
UI or authentication. Keep the caveat explicit, verify the new UI in Phase 10, and
remove the override only after an upstream patched Flowbite release is reviewed.
There is no direct `deepmerge-ts` dependency or global PostCSS override.

Check current advisories with:

```sh
npm audit
npm audit --omit=dev
npm ls --all
```

Zero npm findings are a point-in-time dependency result, not an application
security guarantee. Shared UI interactions are implemented but untested;
authentication is implemented but untested; live user isolation and deployment security remain unverified.

## Implementation verification status

Node-runner cases are authored for profile conversion/normalization, queries,
response contracts, architecture, palette contrast, navigation and shared UI source
invariants, API destinations/response handling and authentication source boundaries. They have
**not been run**. Lint, typecheck, build, audit and runtime checks have not been
rerun for these changes either. Source assertions do not render components and
cannot verify focus, hydration, responsive CSS or Flowbite compatibility.

Final UI checks must include:

- Root preview, unknown route, loading/error fallbacks and frontend health behavior.
- Keyboard skip link, visible focus, menu expansion and active-route announcements.
- Mobile/desktop layouts, zoom and no horizontal overflow at navigation breakpoints.
- Dialog cancel-first focus, Escape/backdrop, focus return, pending guards and errors.
- Actual generated theme classes, provider synchronization and hydration/console warnings.
- No private data, credentials or raw error details in markup, logs or browser storage.

No browser/renderer automation has been installed or run; additional tooling needs
the separate approval described in the local plan. Live user-owned workflows remain
blocked until an approved test identity and disposable writable database are supplied.

Fixtures create no real Clerk accounts, sessions, database users or profiles.
There is no runtime mock-auth switch. Do not perform live user-data writes or
deletion tests without fresh permission and an approved disposable database and
test identity. Preserve local environment files; never publish credentials,
dependencies, agent folders or non-README planning Markdown.
Frontend-specific planning/review Markdown stays under `Frontend/`, not the
repository root, and remains excluded from publication.

Implemented with AI assistance, informed by the React composition/performance
skills, Clerk/Next.js guidance and the backend contracts. No generated API client.

## Historical scaffold validation recorded on 19 November 2026

The following evidence predates Phase 1 and does not verify the current changes.

Final validation used **Node 24.22.3 / npm 11.20.0 on Windows x64**. The coordinator
provided an official standalone Node executable with its SHA-256 verified against
Node's published checksums; global Node was not changed. The initial install also
ran on the machine's Node 26.13.0 and emitted the expected engine warning, then a
clean reinstall and the checks below ran on the recommended Node 24 runtime.
If staying on Node 26 elsewhere, the dependency review recommends patched
26.13.1 rather than 26.13.0.

- Strict `npm ci --strict-peer-deps --ignore-scripts`: passed without engine or
  peer-resolution warnings on Node 24; no dependency install scripts enabled.
- `npm audit --json` and `npm audit --omit=dev --json`: **0 vulnerabilities** each.
- `npm ls --all`: exit 0; `deepmerge-ts@8.0.2` is overridden only under Flowbite.
  Missing optional packages for other platforms are expected, not peer failures.
- `npm run typecheck`, `npm run lint`, and `npm run build`: passed. Build output
  contains only `/_not-found` and `/api/health`; the documented Flowbite
  theme-initialization warning remains intentional.
- `npm run start -- --hostname 127.0.0.1 --port 3100` and
  `npm run dev -- --hostname 127.0.0.1 --port 3101`: health returned HTTP 200,
  `application/json`, and exactly `{"status":"ok"}`; root returned HTTP 404.
  Both test process trees were stopped afterward and both ports released.

No Clerk keys or API URL were supplied to the runtime checks. Linux/native hosting
behavior, real auth, and application features were not tested.

### Shared-root environment verification

- `npm test`: **3 passed** for root fallback, preserving existing values, optional
  missing files and propagating other loader errors.
- `npm run lint`, `npm run typecheck` and `npm run build`: passed on Node 24.22.3
  with the shared root file left in place. No new routes or authentication were added.
