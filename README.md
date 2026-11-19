# Career Mobility Platform

**Latest deployment/auth/UI edits:** verification was stopped at the user's request.
The Dockerfiles, standalone/request-time frontend configuration, session-status fix
and avatar-placement change have not been built or tested. The redirect follow-up
has no completed final build. Earlier results below apply to previously verified code.
The local root `.env` origin allowlists were corrected to accept both localhost:3000
and 127.0.0.1:3000; restart the backend to load this untested configuration fix.

This repository contains two independently runnable projects:

- [`Frontend/`](Frontend/README.md): Next.js App Router, TypeScript, Flowbite React, Tailwind CSS, Clerk SDK and Zod.
- [`Backend/`](Backend/README.md): FastAPI, async SQLAlchemy/Postgres, Alembic, Clerk token verification and explainable opportunity matching.

**Frontend phases 1–9 are implemented, with previously recorded Phase 10 credential-free checks:** palette-themed component-first UI, Clerk authentication, profile/sample forms, opportunity discovery, ranked matching/details, shortlist/notes, dashboard and application-data deletion. The latest completed test run recorded **102 passed**; earlier lint/typecheck/build and safe setup-health probe results are documented in `Frontend/README.md` with their revision limits. Unchanged Phase 10 npm audit results report zero vulnerabilities. Browser interactions and live Clerk/persistence/isolation/deletion remain unverified and need fresh authorization. Frontend phases and follow-ups are maintained on `Frontend`, separately from `main`. Backend phases 1–9 are implemented on `Backend`, each pushed separately; their source is also present on `Frontend`. Migrations and twelve fictional opportunities were applied to the authorized database. This is a prototype, not a production security guarantee.

`openapi-typescript` is intentionally **not included**. Frontend types will be maintained manually against FastAPI's built-in `/openapi.json`, which documents request/response schemas, bearer authentication, filters, pagination and errors.

## Run locally

Prerequisites: **Node 24.22.3 LTS + npm 11.20.0** for the frontend; **uv + managed Python 3.13.18** for the backend. See each project's README for environment setup and verification commands, including the workaround for older uv versions that cannot download the pinned Python release. Keep runtimes consistent between local development and hosting. Global Node/Python installations were not replaced.

Open two terminals from this workspace:

### Frontend

```powershell
cd Frontend
npm ci
npm run dev
```

Open <http://localhost:3000/> for the authenticated dashboard, or check <http://localhost:3000/api/health> for public frontend liveness. Missing Clerk configuration shows an app-branded sign-in-unavailable screen without private data or API-key instructions for users. Match backend CORS and Clerk authorized parties to this exact frontend origin.

### Backend

```powershell
cd Backend
uv sync --locked --managed-python
uv run --locked --managed-python uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

Check <http://127.0.0.1:8000/health>.

Stop either development server with `Ctrl+C`.

## Deploy to Render with Docker (no Compose)

Create **two Docker Web Services** from this repository, both using branch
`Frontend`. Leave the Docker Command override empty so each Dockerfile's `CMD`
starts its service. Both listen on `0.0.0.0` and Render's runtime `PORT`
(default `10000`). No Compose, Blueprint or environment file is required.

| Render setting | Frontend service | Backend service |
| --- | --- | --- |
| Language | Docker | Docker |
| Root Directory | `Frontend` | `Backend` |
| Dockerfile Path | `./Dockerfile` | `./Dockerfile` |
| Docker Build Context | `.` | `.` |
| Health Check Path | `/api/health` | `/health` |

Paths are relative to the selected Root Directory. The backend must be a public
Web Service because browser mutations call it directly, not through Next.js.

Set these values in each service's **Render Environment** settings, not in Git:

| Frontend variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Backend's public HTTPS origin, e.g. `https://career-api.onrender.com`, without `/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk instance's publishable key |
| `CLERK_SECRET_KEY` | Same instance's server secret key; runtime only |

| Backend variable | Value |
| --- | --- |
| `ENV` | `production` |
| `AUTH_MODE` | `clerk` (fail startup if trusted auth configuration is missing) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Same Clerk instance; used to determine the trusted issuer |
| `JWKS_PUBLIC_KEY` | That instance's PEM public signing key; actual or escaped newlines |
| `CORS_ORIGINS` | Exact frontend origin as JSON, e.g. `["https://career-web.onrender.com"]` |
| `CLERK_AUTHORIZED_PARTIES` | Same exact frontend-origin JSON list |
| `DATABASE_URL` | Direct Postgres URL when paired with `DATABASE_URL_POOLED` |
| `DATABASE_URL_POOLED` | Pooled Postgres URL used for application connections |
| `DIRECT_URL` | Optional explicit direct URL for separately authorized migrations |

Replace the example service names with your actual Render URLs. Update both backend
origin lists if you add a custom frontend domain. Configure your production Clerk
instance for the deployed frontend domain; do not add a hard-coded admin token claim.
`CLERK_SECRET_KEY` is not required on the backend, and database credentials are not
required on the frontend.

Render makes its environment settings available both at runtime and as Docker build
arguments. The frontend Dockerfile consumes **only** the two `NEXT_PUBLIC_*`
arguments, because Next.js embeds them in browser bundles. Set both before the first
frontend build; changing either later requires a rebuild (Render's save-and-rebuild
option), not merely a restart. No secret build arguments are declared in either
Dockerfile. Frontend rendering is request-time so Clerk's secret key is needed only
at runtime; it is never supplied to `npm run build` or stored in an image layer.
Both `.dockerignore` files exclude environment files, credentials, agent folders,
dependencies, caches and non-README Markdown from the build context.

Containers do **not** run migrations or seed data on startup. If you deploy against
a new database, separately authorize and run `alembic upgrade head` using the
backend image's shell or Render Pre-Deploy Command (where your plan supports it),
with a direct URL configured. Do not point migration commands at an unapproved
database. The current Dockerfiles have been source-reviewed only, not built or
deployed, per the no-tests/no-builds instruction.

## Configuration and dependency safety

- Keep the shared `.env` in the repository root; neither app requires moving or copying it. Both apps also support an optional `.env` inside their own folder. Real environment variables override project-local values, which override root values (per key). Backend paths are absolute; frontend root lookup is relative to its loader, not the terminal's working directory.
- All `.env*` files (including example templates), agent folders/configuration, dependencies, caches, and Markdown except README files are excluded from Git. Planning documents remain local.
- Shared names: `DATABASE_URL` (direct when paired), `DATABASE_URL_POOLED` (application pool), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `JWKS_PUBLIC_KEY`. Backend verification uses a trusted issuer, the PEM public signing key and exact allowed frontend origins; no Clerk secret-key call is needed. See `Backend/README.md`. Never expose server secrets through `NEXT_PUBLIC_*` variables.
- Standard Neon `postgresql://` URLs are accepted and normalized for asyncpg in memory; environment loaders do not rewrite the root `.env`. Only explicitly referenced `NEXT_PUBLIC_*` values can enter frontend browser bundles; do not add secrets to Next.js's `env` configuration.
- Commit `Frontend/package-lock.json` and `Backend/uv.lock`; use locked installs rather than resolving fresh versions on every run.
- The frontend requires the documented, narrowly scoped Flowbite `deepmerge-ts` security override. It crosses a major version, so retain the caveat and retest before introducing UI interactions.
- Both health endpoints are scaffold liveness checks, not database, authentication or service-readiness guarantees.
- Business endpoints require verified Clerk bearer session tokens; `/health` stays public. `DELETE /api/v1/me` deletes application data, not the Clerk account or session.

## Existing design references

Assessment, project plan, schema, API-contract and dependency-review Markdown documents are local-only and deliberately not published. Actual scaffold manifests and lockfiles are the source of truth for installed dependencies.
