# Career Mobility Platform

This repository contains two independently runnable projects:

- [`Frontend/`](Frontend/README.md): Next.js App Router, TypeScript, Flowbite React, Tailwind CSS, Clerk SDK and Zod.
- [`Backend/`](Backend/README.md): FastAPI, async SQLAlchemy/Postgres, Alembic, Clerk token verification and explainable opportunity matching.

**Frontend phases 1–9 are implemented but unverified:** palette-themed component-first UI, Clerk authentication, profile/sample forms, opportunity discovery, ranked matching/details, shortlist/notes, dashboard and application-data deletion. Phase 1 is pushed to `Frontend`; later phases are separate local commits. Frontend execution checks begin in Phase 10; live user workflows need fresh authorization. Backend phases 1–9 are implemented on the `Backend` branch, each pushed separately. Migrations and twelve fictional opportunities were applied to the authorized database. See each project's README for verification limits. This is a prototype, not a production security guarantee.

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

Open <http://localhost:3000/> for the authenticated dashboard, or check <http://localhost:3000/api/health> for public frontend liveness. Missing Clerk configuration shows setup guidance without private data. Match backend CORS and Clerk authorized parties to this exact frontend origin.

### Backend

```powershell
cd Backend
uv sync --locked --managed-python
uv run --locked --managed-python uvicorn app.main:create_app --factory --reload --host 127.0.0.1 --port 8000
```

Check <http://127.0.0.1:8000/health>.

Stop either development server with `Ctrl+C`.

## Configuration and dependency safety

- Keep the shared `.env` in the repository root; neither app requires moving or copying it. Both apps also support an optional `.env` inside their own folder. Real environment variables override project-local values, which override root values (per key). Backend paths are absolute; frontend root lookup is relative to its loader, not the terminal's working directory.
- All `.env*` files (including example templates), agent folders/configuration, dependencies, caches, and Markdown except README files are excluded from Git. Planning documents remain local.
- Shared names: `DATABASE_URL` (direct when paired), `DATABASE_URL_POOLED` (application pool), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `JWKS_PUBLIC_KEY`. Backend verification uses a trusted issuer, the PEM public signing key and exact allowed frontend origins; no Clerk secret-key call is needed. See `Backend/README.md`. Never expose server secrets through `NEXT_PUBLIC_*` variables.
- Standard Neon `postgresql://` URLs are accepted and normalized for asyncpg in memory; the root `.env` is never rewritten. Only explicitly referenced `NEXT_PUBLIC_*` values can enter frontend browser bundles; do not add secrets to Next.js's `env` configuration.
- Commit `Frontend/package-lock.json` and `Backend/uv.lock`; use locked installs rather than resolving fresh versions on every run.
- The frontend requires the documented, narrowly scoped Flowbite `deepmerge-ts` security override. It crosses a major version, so retain the caveat and retest before introducing UI interactions.
- Both health endpoints are scaffold liveness checks, not database, authentication or service-readiness guarantees.
- Business endpoints require verified Clerk bearer session tokens; `/health` stays public. `DELETE /api/v1/me` deletes application data, not the Clerk account or session.

## Existing design references

Assessment, project plan, schema, API-contract and dependency-review Markdown documents are local-only and deliberately not published. Actual scaffold manifests and lockfiles are the source of truth for installed dependencies.
