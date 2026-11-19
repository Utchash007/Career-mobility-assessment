# Career Mobility Platform — project setup

This repository contains two independently runnable project scaffolds:

- [`Frontend/`](Frontend/README.md): Next.js App Router, TypeScript, Flowbite React, Tailwind CSS, Clerk SDK and Zod.
- [`Backend/`](Backend/README.md): FastAPI, async SQLAlchemy/Postgres tooling, Alembic and configuration for future Clerk verification.

**Frontend remains setup-only.** Backend implementation is progressing on the `Backend` branch; see `Backend/README.md` for phase status. Phase 1 adds shared API contracts and errors, not business routes. All new verification is deferred to the final phase; historical scaffold checks are not evidence for later changes. Do not treat this as a verified production application.

`openapi-typescript` is intentionally **not included**. Frontend API types will be maintained manually when actual endpoints are implemented. FastAPI's built-in OpenAPI documentation is separate and does not require that frontend package.

## Run locally

Prerequisites: **Node 24.22.3 LTS + npm 11.20.0** for the frontend; **uv + managed Python 3.13.18** for the backend. See each project's README for environment setup and verification commands, including the workaround for older uv versions that cannot download the pinned Python release. Keep runtimes consistent between local development and hosting. Global Node/Python installations were not replaced.

Open two terminals from this workspace:

### Frontend

```powershell
cd Frontend
npm ci
npm run dev
```

Check <http://localhost:3000/api/health>. There is deliberately no application page at `/`; a 404 there is expected until UI work is requested.

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
- Shared names: `DATABASE_URL` (direct when paired), `DATABASE_URL_POOLED` (application pool), `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `JWKS_PUBLIC_KEY`. Clerk variables remain reserved and do not enable authentication. Never expose server secrets through `NEXT_PUBLIC_*` variables.
- Standard Neon `postgresql://` URLs are accepted and normalized for asyncpg in memory; the root `.env` is never rewritten. Only explicitly referenced `NEXT_PUBLIC_*` values can enter frontend browser bundles; do not add secrets to Next.js's `env` configuration.
- Commit `Frontend/package-lock.json` and `Backend/uv.lock`; use locked installs rather than resolving fresh versions on every run.
- The frontend requires the documented, narrowly scoped Flowbite `deepmerge-ts` security override. It crosses a major version, so retain the caveat and retest before introducing UI interactions.
- Both health endpoints are scaffold liveness checks, not database, authentication or service-readiness guarantees.
- Any later business endpoint must implement authentication, validation and user isolation before deployment.

## Existing design references

Assessment, project plan, schema, API-contract and dependency-review Markdown documents are local-only and deliberately not published. Actual scaffold manifests and lockfiles are the source of truth for installed dependencies.
