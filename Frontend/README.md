# Frontend — component-first foundation

**Phase 1 is implemented, not yet execution-verified.** The Next.js App Router
scaffold now includes manual API contracts, Zod validation, profile draft/payload
conversion, endpoint-specific query helpers, display labels and palette tokens.
There are still no application pages, authored UI components, live forms,
authenticated API requests or deployment integrations.
`/` intentionally returns Next.js's framework 404. The only authored endpoint is
`GET /api/health`, returning `{"status":"ok"}`; it checks neither the backend nor
external services.

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
and must accompany text, never color alone. Keep light mode. Flowbite/Clerk
component theming will be wired in the UI/authentication phases; tokens alone do
not constitute a finished interface or verified accessibility.

## Toolchain and installation

Recommended runtime: **Node 24.22.3 LTS**, recorded in `.node-version`, `.nvmrc`
and `package.json` engines. Use **npm 11.20.0**. Select Node with your existing
version manager; this project does not install or change global Node.

From `Frontend/`:

These are setup/final-verification commands, not evidence of Phase 1 execution.
Tests, lint, typecheck, builds and runtime probes are currently deferred to Phase 10.

```sh
npm ci --strict-peer-deps --ignore-scripts
npm test
npm run typecheck
npm run lint
npm run build
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open `http://127.0.0.1:3000/api/health`. Stop with Ctrl+C. To run the production
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
  no Flowbite provider or visible component is mounted in this scaffold.
  Its theme-initialization warning is expected because `dark: false` differs from
  the upstream default. Mount the generated initialization when UI is implemented;
  there are no Flowbite runtime components to synchronize yet. The schema URL is
  the upstream URL enforced by the pinned plugin, not a dependency version choice.
- `biome.json`: linting/formatting with generated output excluded. `npm run format`
  formats authored files. `npm run typecheck` generates Next's route types before
  running strict TypeScript checks, so it also works before a first build.
- `tsconfig.json`: `@/*` resolves project-local imports. Explicit `.ts` imports are
  allowed for pure modules so Node 24's native type stripping can run the `.mjs`
  contract tests without a new test runner or transpiler. No runtime TypeScript
  enum/decorator features are used.
- `app/layout.tsx`: required HTML/body wrapper only; no visible application UI.

### Environment and intentionally unwired authentication

No `.env` file, runtime credentials, Clerk instance, database, or backend is needed
for this scaffold. Keep shared credentials in the repository root `.env`. Next.js first
loads `Frontend/.env*` in its normal precedence order; `next.config.ts` then loads the
root `.env` for missing values only, using Node's dotenv parser. Real environment
variables and frontend-local values take precedence per key. Root lookup is anchored
to `load-root-env.mjs`, not the terminal's working directory. A missing root file is allowed.

Optional future variables are `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
and server-only `CLERK_SECRET_KEY`; they are currently unused. `JWKS_PUBLIC_KEY` is
backend-only verification configuration. All `.env*` files, including example templates,
are excluded from Git. Never expose database credentials, the secret key or JWKS
configuration through `NEXT_PUBLIC_` variables or Next.js's `env` configuration.
Public variables are inlined at build time when referenced; rebuild after changing them.

**Clerk is intentionally unwired until authentication implementation.**
`@clerk/nextjs` is installed, but there is no `ClerkProvider`, proxy/middleware,
sign-in page, route protection, token handling, or authentication bypass. The
public health endpoint does not imply any future business endpoint may be public.

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

Zod now validates pure data contracts. Clerk is still unwired.
**`openapi-typescript` is deliberately excluded.** Browser/component testing tools
remain a separate approval decision; no additional dependencies, ESLint or other
UI kit were installed for Phase 1.

### Scoped security override

`package.json` overrides only Flowbite React's `deepmerge-ts` dependency to
**8.0.2**, replacing the vulnerable upstream 7.1.5 pin described in the local
`FRONTEND_DEPENDENCY_REVIEW.md`. This crosses a **major-version boundary** and
is not an upstream-supported combination. The earlier review tested selected
merge/provider behavior; the scaffold's checks do not validate future interactive
UI or authentication. Keep the caveat explicit, retest when implementing UI, and
remove the override only after an upstream patched Flowbite release is reviewed.
There is no direct `deepmerge-ts` dependency or global PostCSS override.

Check current advisories with:

```sh
npm audit
npm audit --omit=dev
npm ls --all
```

Zero npm findings are a point-in-time dependency result, not an application
security guarantee. Authentication, user isolation, UI interactions and deployment
security remain unimplemented and untested.

## Phase 1 verification status

New Node-runner cases are authored for profile conversion/normalization, queries,
response contracts, architectural conventions and palette contrast. They have
**not been run**. Lint, typecheck, build, audit and runtime checks have not been
rerun for these changes either. The architecture checks become substantive as
components and routes are added in later phases.

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
