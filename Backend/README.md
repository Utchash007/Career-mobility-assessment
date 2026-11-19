# Backend implementation

FastAPI + async SQLAlchemy + Neon/Postgres backend, implemented in separate phases.
Health is public; implemented business routes are protected by Clerk verification.

## Phase progress

| Phase | Implementation | Verification |
| --- | --- | --- |
| 0 — scaffold and root environment loading | Completed previously | Historical results below |
| 1 — DTOs, normalization, pagination and common errors | Implemented | Deferred to final phase |
| 2 — database models, initial migration and session dependency | Implemented; revision 0001 applied to the authorized root database | Tests deferred to final phase |
| 3 — Clerk verification and protected API boundary | Implemented | Deferred to final phase |
| 4 — profile read, complete replacement and sample loading | Implemented | Deferred to final phase |
| 5 — validated seed command and opportunity discovery | Implemented; seed writes not run | Deferred to final phase |
| 6 — pure deterministic matcher and explanations | Implemented | Deferred to final phase |
| 7 — ranked recommendation list and individual breakdown | Implemented | Deferred to final phase |
| 8 — shortlist and application-data deletion | Pending | Deferred to final phase |

### Recommendation routes

- `GET /api/v1/matches`: page/page_size and common opportunity filters, optional label;
  no custom sort, score, weights, profile body or selected user ID.
- `GET /api/v1/matches/{opportunity_id}`: independent full breakdown for one role.

Missing profile always returns 409 PROFILE_REQUIRED before opportunity lookup/evaluation,
including empty filtered results. All candidates are evaluated and label-filtered before
ranking, totals and paging; every list item contains all five criteria and full findings.
Match detail and list use the same pure engine and saved profile. Results are recalculated
on each request; no match table or shared user-response cache is used.

### Matching rules — version 1.0.0

Five base weights: skills 30%, language 20%, experience 20%, education 15%, location 15%.
Unknown scores are null and excluded from the weighted denominator; no role requirement
is a met score, not missing user evidence. Only the final overall score is rounded
to one decimal. Labels use that returned score: strong >=75, partial >=50, otherwise
weak. Any critical finding takes precedence; all-unknown without critical findings
is insufficient_data. Sort: critical last, numeric scores descending (null last),
evaluated count descending, opportunity ID ascending.

Resolved formula details, consistent with required/preferred and missing-data semantics:

- Skills: required overlap `r`, plus bounded bonus `0.2 * (1-r) * preferred_overlap`.
  Missing preferences never lower required overlap; no required skills (including
  preferred-only roles) scores 1. An undeclared skill list with required skills is unknown.
- Language: mean of required-language level ratios, each capped at 1 (levels 1–4).
  A missing required language in a declared list scores 0 and flags critical; an empty
  declaration is unknown/verify. Below-required proficiency is critical. Preferences
  are evidence only, never a penalty; no required languages scores 1.
- Experience: in range 1; one year short 0.6; two years short 0.3; three or more short 0.
  Above maximum scores `0.6 / years_above`. Unbounded maximum imposes no upper penalty;
  minimum 0 with no maximum states no restriction and scores 1 even for unknown experience.
- Education: required level shortfall 0; meets level + related/any field 1; known unrelated
  field 0.5. If level meets but field cannot be mapped, score null; a proven level gap
  still scores 0. Preferred-only education scores 1. Education fit gaps are **score-only**,
  not automatic critical findings. This resolves the schema's optional “can emit” wording
  with the planned weak Data Scientist case; enrolment remains a separate hard constraint.
- Location: preferred hiring country 1; otherwise remote 0.7; otherwise 0. No preferences
  is unknown, including global remote. Location never establishes work authorization.
- Criterion statuses: null unknown, 1 met, 0 unmet, strictly between 0 and 1 partial.

Eligibility severity mapping: critical unmet -> critical, critical unknown -> verify;
verify unmet -> info, verify unknown -> verify; info -> info. Self-declared authorization
is informational and always labelled unverified. Unknown/unlisted countries and student
visas require verification. Sponsorship becomes a hard gap only when explicitly unavailable.
Licence/other checks have no profile evidence and remain unknown, never invented satisfied.
The matcher imports no database/web code, calls no LLM, stores no results, and never uses
name, birthday or career interests. Reasons and evidence come from the same computations.

### Opportunities and explicit seed command

`GET /api/v1/opportunities` supports page/page_size, q, country, type, work_mode and
id_asc/title_asc/title_desc sorting. Detail: `GET /api/v1/opportunities/{opportunity_id}`.
Browsing needs a verified session, not a saved profile. Saved state is current-user-only.
The twelve-role prototype reads a filtered collection once then pages it in memory,
keeping totals and items from the same logical snapshot; this is not a bulk-export API.

`app/data/seed_opportunities.json` contains twelve fictional roles. The seed loader
validates the complete fixture before starting one atomic upsert-by-slug transaction.
It preserves opportunity IDs, unrelated rows and unchanged timestamps; it never truncates
tables or runs on startup. Migration authorization does not implicitly execute this seed.
After confirming the intended target, run from `Backend/`:

```powershell
uv run --locked --managed-python python -m app.db.seed --apply
```

### Profile routes

- `GET /api/v1/profile`: own profile, or 404 `PROFILE_NOT_FOUND`.
- `PUT /api/v1/profile`: full replacement; 201 on first creation, otherwise 200.
- `POST /api/v1/profile/sample`: send `{}` to load the fictional sample under your own identity.

All requests use a Clerk bearer session token; writes use `Content-Type: application/json`.
Omitted optional profile fields reset to their defaults. Experience null is not zero;
enrolment null is not false; authorization countries not declared remain unknown.
Profile edits preserve existing shortlist rows. Name and birthday do not affect matching.
| 9 — all tests and integration verification | Pending | Not run yet |

Per project instruction, no tests, lint, format checks, health probes or application
execution checks are run during implementation phases. Phase commits are not claims
of verified correctness; all verification is deferred to Phase 9.

Phase 1 adds strict nested write contracts, explicit unknown values, common collection
queries (`page=1`, `page_size=10`, maximum 100), duplicate/unknown query rejection and
safe error envelopes. No database writes or business endpoints are added in this phase.

Matching formula details (empty skill requirements, multi-language aggregation,
experience distance, unknown education fields and education critical-flag policy)
will be finalized and documented with the matcher in Phase 6 before final testing.

## Python and installation (Windows PowerShell)

The project targets **uv-managed CPython 3.13.18**, pinned in `.python-version`, not the
machine's Python 3.15. Use a current uv release to download this Python patch.
Python installation used temporary uv 0.13.9; lock/sync and checks used the existing
uv 0.8.14 successfully once the managed interpreter was installed.
All commands below run from `D:\AI_Projects\Panama_assessment\Backend`.

```powershell
Set-Location D:\AI_Projects\Panama_assessment\Backend
uv python install 3.13.18
uv sync --locked --managed-python
# Keep shared credentials in ../.env; Backend/.env is an optional override.
uv run --locked --managed-python uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --reload
```

If uv is not on PATH, replace `uv` with
`& "$env:USERPROFILE\.local\bin\uv.exe"`. Older uv releases may not know the pinned
Python download; use a current uv rather than the system Python. No activation is required;
uv creates `Backend/.venv`. Stop the server with **Ctrl+C**.

If your installed uv is too old to download 3.13.18 and already has managed Python 3.13.7,
this one-time alternative uses a temporary current uv, without upgrading the global tool:

```powershell
uv run --no-project --managed-python --python 3.13.7 --with uv==0.13.9 python -m uv python install 3.13.18
```

- `GET http://127.0.0.1:8000/health` → `{"status":"ok"}`
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`
- Built-in OpenAPI: `http://127.0.0.1:8000/openapi.json`

There is no additional OpenAPI generator. Health is **process liveness only**, never DB
readiness or proof of valid Clerk credentials. Startup and health perform no DB/Clerk
network requests, including when a database URL is supplied.

## Configuration

Settings load the repository root `.env`, then optional `Backend/.env`, using absolute
paths derived from the configuration module. Real environment variables take precedence
over both files; project-local values override root values per key. Missing files are
allowed. No `.env*` file, including example templates, is published to GitHub.

| Variable | Default / behavior |
| --- | --- |
| `ENV` | `development`; also accepts `test`, `production` |
| `AUTH_MODE` | `auto` by default; uses supplied trusted Clerk configuration. `disabled` denies business access; explicit `clerk` requires trusted configuration. No `dev` bypass. |
| `CORS_ORIGINS` | JSON array `["http://localhost:3000"]`; exact HTTP(S) origins only |
| `DATABASE_URL` | Empty; **direct** Neon URL when paired with `DATABASE_URL_POOLED`; legacy application URL when supplied alone |
| `DATABASE_URL_POOLED` | Empty; if supplied, used for application connections instead of `DATABASE_URL` |
| `DIRECT_URL` | Optional explicit migration URL; otherwise uses `DATABASE_URL` only when the paired convention is supplied |
| `DB_POOL_SIZE` | `5` (1–20); used only when the database scaffold is explicitly used |
| `DB_POOL_RECYCLE_SECONDS` | `300` (1–300); lower to match your Neon project's idle timeout |

CORS allows GET/PUT/POST/PATCH/DELETE, Authorization and Content-Type for exact configured
origins; credentialed cookies are not used. Every `/api/v1` request is authenticated
before parsing its body or query. `/health` remains public. CORS is not authentication.

Set `JWKS_PUBLIC_KEY` to Clerk's **PEM public signing key**, not a URL or JWKS JSON.
Actual newlines or escaped `\n` are supported. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` supplies
the trusted Clerk instance hostname; optional `CLERK_ISSUER` overrides it with an exact
HTTPS origin. `CLERK_AUTHORIZED_PARTIES` optionally supplies an exact-origin JSON list,
otherwise `CORS_ORIGINS` is used. Missing `azp` is deliberately rejected. Clock skew is
5 seconds by default (`CLERK_CLOCK_SKEW_SECONDS`, 0–30).

RS256 signature, issuer, exp/nbf/iat, authorized party, user identity and active session
claims are verified with PyJWT. No per-request Clerk call or secret-key lookup is needed.
`CLERK_SECRET_KEY` is not used by this backend. Signing-key rotation requires updating
the root key and restarting the backend; rotating remote JWKS is not implemented.
Missing/invalid trusted configuration never becomes a fixed user or public API access.

## Database and Alembic scaffold

`app/db/session.py` exposes lazy engine/session resources, with async SQLAlchemy,
`asyncpg`, `pool_pre_ping`, bounded pooling and recycling. The lifespan disposes resources
on shutdown; no engine is created at startup. Sessions do not auto-commit: future callers
must explicitly own transactions. `app/db/base.py` provides declarative metadata for
the three models in `app/db/models.py`. Integration tests
will be added in Phase 9 and require a separate disposable Postgres target; SQLite is
not supported for JSONB/ARRAY persistence. Do not use the root application's database
as a destructive test fixture.

The existing shared-file naming convention is supported (fake placeholders only):

```text
DATABASE_URL=postgresql://USER:PASSWORD@DIRECT_HOST/DATABASE?sslmode=require&channel_binding=require
DATABASE_URL_POOLED=postgresql://USER:PASSWORD@POOLED_HOST/DATABASE?sslmode=require&channel_binding=require
```

Settings normalize `postgres://` / `postgresql://` to `postgresql+asyncpg://`, map `sslmode`
to asyncpg's `ssl` option and remove libpq's unsupported `channel_binding` option, all
in memory without editing `.env`. Channel-binding enforcement is not provided by this
driver adaptation. Existing `postgresql+asyncpg://...?ssl=require` URLs also work.
Percent-encode reserved characters in passwords. Never commit credentials or print URLs.
Real Neon TLS connectivity, pooling and database operations have **not** been validated.

Alembic uses the resolved direct URL with `NullPool`, never `DATABASE_URL_POOLED`.
`DIRECT_URL` wins when set; otherwise the paired convention supplies the direct
`DATABASE_URL`. A legacy `DATABASE_URL` supplied alone is not inferred to be direct.
Revision `0001` creates `profiles`, `opportunities` and `shortlist`. It has been authored
and was applied to the root `.env` database after explicit authorization. The migration
command succeeded; no tests or health probes were run. This command needs no database:

```powershell
uv run --locked --managed-python alembic heads
```

Review migration SQL and confirm the intended database before applying it. Migrations
do not run automatically at application startup. `alembic current`/migration commands
require your own direct URL and a reachable database; startup does not.

## Checks

```powershell
uv sync --locked --managed-python
uv run --locked --managed-python ruff check .
uv run --locked --managed-python ruff format --check .
uv run --locked --managed-python pytest
Invoke-RestMethod http://127.0.0.1:8000/health
```

Dependency pins are in `pyproject.toml`; `uv.lock` locks transitive dependencies and artifact
hashes. Direct versions were checked against live PyPI metadata on 2026-11-19, then
resolved and installed, not inferred from the project plan. To audit the locked packages
using a temporary audit tool (not an application dependency):

```powershell
uv export --locked --format requirements-txt --no-emit-project --output-file audit-requirements.txt
uv run --no-project --managed-python --with pip-audit==2.10.1 python -m pip_audit --requirement audit-requirements.txt --require-hashes --disable-pip --progress-spinner off
```

An advisory scan does not establish that the app, Python runtime or infrastructure is
secure. External service behavior and future authentication/business logic remain untested.

### Setup verification (2026-11-19, Windows)

- `uv sync --locked --managed-python`: installed all 37 locked environment packages;
  subsequent `--check` reported no changes.
- `uv pip check --python .venv/Scripts/python.exe`: all installed packages compatible.
- `ruff check .`: passed; `ruff format --check .`: all 15 Python files formatted.
- `pytest`: **45 passed**, including credential-free lifespan/health, exact CORS,
  environment configuration, URL validation, rejected auth modes and lazy DB resources.
- `alembic heads`: succeeded, with no revisions. Offline migration execution without
  `DIRECT_URL` was intentionally rejected before any connection could be attempted.
- `pip-audit 2.10.1`: scanned the full 37-package exported lock, including dev dependencies,
  and reported **no known vulnerabilities**. This is an advisory result, not a security guarantee.
- A real Uvicorn factory startup on `127.0.0.1:8000` returned HTTP 200 and `{"status":"ok"}`;
  the server completed lifespan shutdown and a subsequent check found no listener on 8000.

No Neon or Clerk credentials were used or required. Their live behavior remains unverified.

### Shared-root environment verification

- Updated suite: **55 tests passed**, including root/project/process precedence,
  optional files, anchored paths, paired database URLs and Neon URL normalization.
- Ruff lint and formatting checks passed.
- The actual root `.env` loaded successfully when invoked from the repository root;
  health returned 200 without constructing a database engine or contacting Clerk.
  Credentials were not printed and the file was not edited. Live service behavior
  still remains unverified.
