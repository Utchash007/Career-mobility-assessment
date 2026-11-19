# Backend setup only

Minimal FastAPI scaffold for the intended FastAPI + async SQLAlchemy + Neon/Postgres
architecture. Local-only planning documents describe future work: no models,
application tables, migration revisions, seed data, business
endpoints, matcher, or authentication are implemented here.

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
| `AUTH_MODE` | Only `disabled` is accepted; `dev` and `clerk` fail validation, including production |
| `CORS_ORIGINS` | JSON array `["http://localhost:3000"]`; exact HTTP(S) origins only |
| `DATABASE_URL` | Empty; **direct** Neon URL when paired with `DATABASE_URL_POOLED`; legacy application URL when supplied alone |
| `DATABASE_URL_POOLED` | Empty; if supplied, used for application connections instead of `DATABASE_URL` |
| `DIRECT_URL` | Optional explicit migration URL; otherwise uses `DATABASE_URL` only when the paired convention is supplied |
| `DB_POOL_SIZE` | `5` (1–20); used only when the database scaffold is explicitly used |
| `DB_POOL_RECYCLE_SECONDS` | `300` (1–300); lower to match your Neon project's idle timeout |

CORS currently permits only `GET`, `Authorization` and `Content-Type`; credentialed cookies
are not enabled. Extend the method allowlist when business routes are actually added.
CORS is a browser policy, **not authentication**. `AUTH_MODE=disabled` does not protect
anything: this scaffold exposes only public health/docs and must not gain business
routes without actual authentication and authorization.

PyJWT's crypto extra is installed for **future** Clerk verification only. Reserved Clerk
variables `CLERK_SECRET_KEY`, `JWKS_PUBLIC_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
may remain in the shared root file; they are ignored by backend settings and not used by auth code.
There is no fixed development identity, token verification, password handling or Clerk call.

## Database and Alembic scaffold

`app/db/session.py` exposes lazy engine/session resources, with async SQLAlchemy,
`asyncpg`, `pool_pre_ping`, bounded pooling and recycling. The lifespan disposes resources
on shutdown; no engine is created at startup. Sessions do not auto-commit: future callers
must explicitly own transactions. `app/db/base.py` is empty declarative metadata, not
application schema. No database service or SQLite fixture is needed for setup tests.

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
No revisions or application-table creation exist. This command needs no database:

```powershell
uv run --locked --managed-python alembic heads
```

Do not run autogeneration against an existing database while metadata is empty: Alembic
may propose dropping existing tables. Add reviewed models and revisions only in future
schema work. `alembic current`/migration commands require your own direct URL and a
reachable database; startup does not.

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
