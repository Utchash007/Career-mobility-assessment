# Career Mobility Platform

**Latest deployment/auth/UI edits:** verification was stopped at the user's request.
The single-service Dockerfile, standalone/request-time frontend configuration, session-status fix
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

Create **one Docker Web Service** using the repository-root `Dockerfile`. It builds
and runs **both Next.js and FastAPI in one container**. Do not create a second
Render service. There is no Compose, Blueprint or separate launcher file.

| Render setting | Value |
| --- | --- |
| Language | Docker |
| Branch | `Frontend` |
| Root Directory | Leave empty (repository root) |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context | `.` |
| Docker Command | Leave empty |
| Health Check Path | `/health` |

Next.js listens on `0.0.0.0` and Render's `PORT` (default `10000`). FastAPI listens
only on `127.0.0.1:8000` inside the same container. Next.js forwards `/api/v1/*`
requests and `/health` to FastAPI without implementing business logic or modifying
bearer tokens. FastAPI still verifies every protected API request. Browser calls
use the **same public origin** as the frontend; server-side reads use the private
loopback URL. `/health` goes through both servers, while `/api/health` checks only
Next.js. Neither checks the database or live Clerk service.

The Dockerfile contains its entire lifecycle launcher. Tini handles PID 1 duties;
Bash starts both servers and stops both if either exits or Render shuts down the
container. Both apps run as a non-root user. CPU and memory are shared by both apps.

Put **all** configuration in this one service's **Render Environment** settings:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | **This same service's** public HTTPS origin, e.g. `https://career-mobility.onrender.com`, without `/api/v1` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your Clerk instance's publishable key |
| `CLERK_SECRET_KEY` | Same instance's server secret key; runtime only |
| `ENV` | `production` |
| `AUTH_MODE` | `clerk` (fail startup if trusted auth configuration is missing) |
| `JWKS_PUBLIC_KEY` | That instance's PEM public signing key; actual or escaped newlines |
| `CORS_ORIGINS` | The same service origin as JSON, e.g. `["https://career-mobility.onrender.com"]` |
| `CLERK_AUTHORIZED_PARTIES` | Same exact public-origin JSON list; **not** `127.0.0.1:8000` |
| `DATABASE_URL` | Direct Postgres URL when paired with `DATABASE_URL_POOLED` |
| `DATABASE_URL_POOLED` | Pooled Postgres URL used for application connections |
| `DIRECT_URL` | Optional explicit direct URL for separately authorized migrations |

Replace the example hostname with your actual Render hostname. Update both origin
lists if you add a custom domain. Configure your production Clerk instance for that
public domain; no hard-coded admin token claim is needed. The Dockerfile sets
`API_INTERNAL_URL` and `PANAMA_SINGLE_CONTAINER` automatically; do not override them.

Render supplies environment settings at runtime and as Docker build arguments.
Only the two public `NEXT_PUBLIC_*` arguments are consumed by the frontend build.
Set both before the first build; changes require rebuilding, not just restarting.
Clerk's secret and database credentials are runtime-only: no secret build arguments
are declared and no `.env` is included in the image. Request-time frontend rendering
avoids requiring Clerk secrets during the build. The root `.dockerignore` excludes
local credentials, agent folders, dependencies, caches and non-README Markdown.

The container does **not** run migrations or seed data at startup. For a separately
authorized new database, use `cd /app/Backend && alembic upgrade head` in Render's
shell or Pre-Deploy Command (where your plan supports it), with a direct URL set.
Do not migrate an unapproved database. This single-service correction is
source-reviewed only, not built, tested or deployed, per the user's instruction.

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
