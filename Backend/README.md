# Backend implementation

FastAPI + async SQLAlchemy + Neon/Postgres backend, implemented in separate phases.
Health is public; implemented business routes are protected by Clerk verification.

## Phase progress

| Phase | Implementation | Verification |
| --- | --- | --- |
| 0 — scaffold and root environment loading | Complete | Configuration/health tests |
| 1 — DTOs, normalization, pagination and errors | Complete | Contract/unit tests |
| 2 — Postgres models and migrations | Complete; migrated through 0002 | Read-only live schema checks |
| 3 — Clerk session verification | Complete | Local signing-key tests; no live Clerk session |
| 4 — profile APIs | Complete | Offline checks; live user workflows skipped |
| 5 — seed and opportunity discovery | Complete; twelve roles seeded | Live seed round-trip and connection checks |
| 6 — pure matching engine | Complete | Fictional scenarios and unknown-data tests |
| 7 — recommendation APIs | Complete | Offline orchestration/contract tests |
| 8 — shortlist, notes and application-data deletion | Complete | Offline checks; live user workflows skipped |
| 9 — verification and handoff | Complete within authorized scope | User-dependent live tests explicitly skipped |

Tests, lint and execution checks were intentionally deferred until Phase 9. Migrations
and opportunity seeding were separately authorized against the root database. No Clerk
account or database profile was created for tests. See **Final verification** below for
the precise scope; mocks and in-memory fictional data are not live-user integration proof.

### Shortlist and privacy routes

`GET /api/v1/shortlist` uses common filters/pagination, sorting by created_at_desc
(default), created_at_asc or title_asc, ties by opportunity ID. Saves are addressed
only by opportunity ID:

- `POST /api/v1/shortlist/{opportunity_id}` with `{}` or `{"note":"..."}`: 201 new,
  200 already saved. Omitted note preserves existing text; explicit note updates it.
- `PATCH /api/v1/shortlist/{opportunity_id}` requires `note` (0–500 chars); empty clears
  it; absence from your saved set is 404 SHORTLIST_ITEM_NOT_FOUND.
- `DELETE /api/v1/shortlist/{opportunity_id}`: idempotent 204, no body, even for absent IDs.

All shortlist operations need a saved profile (409 PROFILE_REQUIRED). Mutations lock
that user's profile and use one explicit transaction. Unique keys prevent duplicates;
unchanged notes preserve timestamps. Lists contain no copied/stale match results.

`DELETE /api/v1/me` atomically removes only your application profile and saved rows,
returns actual removal counts, and preserves seeded opportunities. Repeat returns zero
removals. `clerk_account_deleted` is always false: this is **not account deletion**,
session revocation or sign-out. Clerk account management remains with Clerk's prebuilt UI.

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

## Render Docker service

Use the **repository-root `Dockerfile` for one Render service running both apps**.
Leave Root Directory and Docker Command empty; use Dockerfile Path `./Dockerfile`,
Docker Build Context `.`, branch `main` and Health Check Path `/health`.
Do not create a separate backend service.

The multi-stage image uses Python 3.13.18 and pinned uv 0.13.9 to install only
production dependencies from `uv.lock`. Its non-root runtime starts the Uvicorn
application factory on private `127.0.0.1:8000`, without development reload or
dependency installation at startup. Next.js serves Render's public `PORT` and
forwards `/api/v1/*` and `/health` here. All API authentication, resource ownership
and mutations remain in FastAPI; proxying does not bypass bearer verification.

All backend configuration comes from Render Environment settings at runtime;
there are no secret build arguments or embedded `.env` files. Set `ENV=production`,
`AUTH_MODE=clerk`, the trusted Clerk instance's publishable key and PEM
`JWKS_PUBLIC_KEY`, both frontend-origin JSON lists, and your Postgres URLs. Use the
single service's public HTTPS origin in both lists, not the private loopback URL.
In Docker mode on Render, settings automatically add `RENDER_EXTERNAL_URL` and a
configured public `NEXT_PUBLIC_API_URL` to both lists, preserve explicit public
origins, and remove local loopback entries. This prevents copied development origin
lists from rejecting production sessions. Other deployment modes are unchanged.
The backend does not consume `CLERK_SECRET_KEY`. See the root README for the full
single-service environment table and frontend rebuild requirements. The Dockerfile
contains the launcher that stops both apps if either exits or Render shuts down.

The image includes Alembic but does not migrate or seed the database on startup.
Only run `alembic upgrade head` separately for an authorized target database with
a direct URL configured. The root `.dockerignore` keeps local secrets, environments, caches,
tests and non-README Markdown out of the context. No container builds, tests or live
requests were run for this packaging change.

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

For local development at either frontend address, configure both
`CORS_ORIGINS` and `CLERK_AUTHORIZED_PARTIES` as
`["http://127.0.0.1:3000","http://localhost:3000"]`. These remain exact origins,
not a wildcard or auth bypass. Restart the backend after changing environment
files: settings are loaded at startup and cached, not reloaded per request.
The latest ignored root `.env` correction adds the previously excluded localhost
origin; it changes no credentials and was not live-tested at the user's request.
Custom `publicMetadata.role` claims are not consulted for these checks and cannot
repair an origin mismatch. No admin claim is required to use the application.

RS256 signature, issuer, exp/nbf/iat, authorized party, user identity and active session
claims are verified with PyJWT. No per-request Clerk call or secret-key lookup is needed.
`CLERK_SECRET_KEY` is not used by this backend. Signing-key rotation requires updating
the root key and restarting the backend; rotating remote JWKS is not implemented.
Missing/invalid trusted configuration never becomes a fixed user or public API access.

Render logs report fixed rejection reason codes such as `authorized_party_mismatch`,
`signature_mismatch`, `issuer_mismatch`, `token_expired`, and `missing_required_azp`.
Tokens, claim values, identities, request bodies and headers are never logged.
Startup logs include only the configured public issuer/origins and signing-key
presence, not credentials. The Render origin fix and its added regression cases
are source-reviewed only; no tests, builds or live authentication were run.

## Database and migrations

`app/db/session.py` exposes lazy engine/session resources, with async SQLAlchemy,
`asyncpg`, `pool_pre_ping`, bounded pooling and recycling. The lifespan disposes resources
on shutdown; no engine is created at startup. Sessions do not auto-commit: services
explicitly own transactions. `app/db/base.py` provides metadata for the three models
in `app/db/models.py`. SQLite is not supported for JSONB/ARRAY persistence. No destructive
test fixture uses the root database. Current live tests run in read-only transactions
and do not access user data; writable integration tests require a separate approved target.

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
The authorized database accepted migrations, seed upserts, direct reads and pooled
application reads. These checks are not a production load or long-running pooler test.

Alembic uses the resolved direct URL with `NullPool`, never `DATABASE_URL_POOLED`.
`DIRECT_URL` wins when set; otherwise the paired convention supplies the direct
`DATABASE_URL`. A legacy `DATABASE_URL` supplied alone is not inferred to be direct.
Revision `0001` creates `profiles`, `opportunities` and `shortlist`; `0002` aligns
opportunity/shortlist identities with `GENERATED ALWAYS` without replacing rows.
Both were applied to the root `.env` database after authorization. These commands
describe the explicit workflow; migration writes never happen automatically:

```powershell
uv run --locked --managed-python alembic heads
uv run --locked --managed-python alembic upgrade head
uv run --locked --managed-python python -m app.db.seed --apply
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
secure. Live Clerk sessions and user-owned database workflows remain unverified.

### Historical scaffold verification (before backend implementation)

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

The historical scaffold run did not use Neon or Clerk credentials; the current database
verification described below is separate.

### Historical shared-root environment verification

- Updated suite: **55 tests passed**, including root/project/process precedence,
  optional files, anchored paths, paired database URLs and Neon URL normalization.
- Ruff lint and formatting checks passed.
- The actual root `.env` loaded successfully when invoked from the repository root;
  health returned 200 without constructing a database engine or contacting Clerk.
  Credentials were not printed and the file was not edited. Live service behavior
   still remains unverified.

## Final verification — Phase 9 (2026-11-19)

- **202 passed, 1 skipped** with the explicitly enabled read-only database checks.
- **197 passed, 6 skipped** from a fresh Git source snapshot installed with
  `uv sync --locked --managed-python`, without any `.env` files or service credentials.
- Ruff lint passed; all **66 Python files** passed formatting checks.
- Locked installation succeeded; all **37 installed packages** passed compatibility checks.
- OpenAPI documents all **13 operations across 10 paths**, Clerk bearer security,
  collection filters/pagination and safe error envelopes.
- Pure tests cover finalized fictional scenarios, unknown vs zero/false, preferred-only
  requirements, authorization/sponsorship semantics, deterministic ranking and privacy.
- Local-key JWT tests cover signatures, algorithm rejection, issuer, authorized party,
  timestamps, pending/non-user sessions and authentication-before-validation ordering.
- Offline service/SQL tests cover rank-before-page, label-filter totals, profile-required
  ordering, owner-scoped parameterized queries, note omission and deletion retry counts.
- After explicit authorization, migrations **0001 → 0002** and the opportunity seed command
  succeeded against the root database. Live checks verified migration head, JSONB/ARRAY
  round-trips, identity generation, uniqueness/cascade metadata, direct connection reads
  and pooled application reads. Live test transactions were explicitly **read-only**.

**Not performed:** real Clerk sign-in/session verification; database profile creation,
two-user isolation, user-owned CRUD end-to-end, concurrent saves/deletion, rollback fault
injection, migration downgrade/re-upgrade and production load testing. These need an
approved disposable writable database and, for real auth, a supplied Clerk test session.
They were skipped per instruction rather than creating any user/account/profile.
No existing user data was selected, changed or deleted by the live checks. The authorized
seed wrote opportunity rows only. No frontend implementation or tests were added here.

To repeat only credential-free checks, run from `Backend/`:

```powershell
uv run --locked --managed-python pytest -q
uv run --locked --managed-python ruff check .
uv run --locked --managed-python ruff format --check .
```

Only after approving read access to the configured database:

```powershell
$env:BACKEND_READ_ONLY_DB_TESTS = "1"
uv run --locked --managed-python pytest -q
Remove-Item Env:BACKEND_READ_ONLY_DB_TESTS
```

### Computed fictional examples

These are actual pure-engine outputs for the in-memory sample, not stored user matches:

| Role | Score | Label | Important finding |
| --- | ---: | --- | --- |
| Programme Assistant, Berlin | 95.2 | strong | Work authorization requires verification |
| Programme Support Officer, Geneva | 69.0 | partial | Skills/location gaps; French preference is not a penalty |
| German-speaking Client Associate | 68.0 | not_recommended | Required German absent from declared languages |
| Business Analyst Intern | 76.0 | not_recommended | Explicitly not enrolled; authorization also requires verification |
| Senior Operations Manager | 56.0 | partial | Six-year experience shortfall despite other matching criteria |
| Data Scientist | 35.0 | weak | Skills, experience and required education gaps |
| Financial Analyst | 35.0 | weak | Skills, experience, field and location gaps; authorization unknown |

The earlier plan's hoped-for weak senior-manager label is **not** a computed truth.
Language, no required education, location and preferred reporting contribute 56 even
with zero required-skills/experience fit. No role-specific score override is added.
Use the criterion breakdown, not a label alone, when deciding whether to apply.

### Manual API use and integration boundary

After configuring the backend's trusted signing key/issuer/origins, obtain a real Clerk
session token from the frontend SDK. Do not use a Clerk secret key as the bearer token.
Keep tokens out of scripts, Git and logs. Example using an existing process variable:

```powershell
$headers = @{ Authorization = "Bearer $env:CLERK_SESSION_TOKEN" }
Invoke-RestMethod "http://127.0.0.1:8000/api/v1/opportunities?page=1&page_size=10" -Headers $headers
```

For `POST /profile/sample`, send `{}` with JSON content type; it replaces the caller's
profile after explicit confirmation. Do not call it merely to probe server readiness.
`http://localhost:3000` and `http://127.0.0.1:3000` are different origins; configure CORS
and authorized parties to the exact origins used by your frontend. No custom login API,
opportunity-write API, stored matching job or frontend type generator is introduced.

### Technical note and limitations

- Flow: router → service → repository → async Postgres; services own transactions.
  Authentication middleware runs before body/query validation; each protected route
  also declares the verified-user dependency. Health/startup never warms the database.
- Profiles use a single degree and a single country-list authorization status. Mixed
  per-country statuses, verified visas/licences, salary and application deadlines are
  out of scope. Name/birthday/interests never affect matching.
- Unknown fields and aliases remain unknown rather than silently legal/eligible.
  Work authorization is always self-declared/unverified, never a legal determination.
- No RLS, admin APIs, rate limiter, infrastructure body limit, remote JWKS rotation,
  queues or LLM calls. Key rotation requires key update and backend restart. Deployment
  hardening and writable isolation/concurrency testing are follow-up work.
- Whole filtered collections are read in memory for this twelve-role prototype. Larger
  catalogs need bounded database pagination for browsing and an explicit ranking strategy.
- The frontend is still a scaffold; authentication UI and the full product journey have
  not been built or tested. A passing mock suite is not end-to-end service proof.

### AI/tool and service disclosure

Implementation was AI-assisted through OpenCode: planning, FastAPI/Pydantic/SQLAlchemy
code, matching rules, tests and documentation. The `fastapi-templates` skill informed
async dependencies and service/repository layering; the Clerk skill/documentation
informed session verification. PostgreSQL replaced the template's SQLite examples;
Clerk replaced password-auth examples. No subagents or paid AI service are required
at runtime. Human review and the unperformed live-user checks remain necessary before
submission/deployment. Clerk is the intended identity provider; Neon/Postgres stores
application data. Tests used local signing keys, not real Clerk accounts.
