# syntax=docker/dockerfile:1

# One Render service: Next.js serves the public port and forwards API requests
# to FastAPI on container-local port 8000. Build from the repository root.
FROM node:24.22.3-bookworm-slim AS frontend-base
WORKDIR /app/Frontend
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true
RUN npm install --global npm@11.20.0

FROM frontend-base AS frontend-dependencies
COPY Frontend/package.json Frontend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM frontend-base AS frontend-builder
COPY --from=frontend-dependencies /app/Frontend/node_modules ./node_modules
COPY Frontend/ ./
# Render exposes Environment settings as build arguments. Consume public values
# only; Clerk secrets and database credentials must never be build arguments.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY} \
    PANAMA_SINGLE_CONTAINER=true
RUN : "${NEXT_PUBLIC_API_URL:?Set NEXT_PUBLIC_API_URL to this Render service's HTTPS origin}" \
    && : "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:?Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in Render}" \
    && mkdir -p public \
    && npm run build

FROM python:3.13.18-slim-bookworm AS backend-builder
COPY --from=ghcr.io/astral-sh/uv:0.13.9 /uv /usr/local/bin/uv
WORKDIR /app/Backend
ENV UV_PYTHON_DOWNLOADS=0 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1
COPY Backend/pyproject.toml Backend/uv.lock Backend/README.md ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --no-install-project --python /usr/local/bin/python

FROM python:3.13.18-slim-bookworm AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PANAMA_SINGLE_CONTAINER=true \
    API_INTERNAL_URL=http://127.0.0.1:8000 \
    VIRTUAL_ENV=/app/Backend/.venv \
    PATH="/app/Backend/.venv/bin:${PATH}" \
    PORT=10000
RUN apt-get update \
    && apt-get install -y --no-install-recommends bash tini libstdc++6 libatomic1 ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 app \
    && useradd --uid 10001 --gid app --no-create-home --home-dir /app app
COPY --from=frontend-base /usr/local/bin/node /usr/local/bin/node
COPY --from=frontend-builder --chown=app:app /app/Frontend/.next/standalone ./Frontend/
COPY --from=frontend-builder --chown=app:app /app/Frontend/.next/static ./Frontend/.next/static
COPY --from=frontend-builder --chown=app:app /app/Frontend/public ./Frontend/public
COPY --from=backend-builder --chown=app:app /app/Backend/.venv ./Backend/.venv
COPY --chown=app:app Backend/app ./Backend/app
COPY --chown=app:app Backend/alembic ./Backend/alembic
COPY --chown=app:app Backend/alembic.ini ./Backend/alembic.ini

# Keep the complete launcher inside this Dockerfile. Tini reaps descendants;
# Bash stops both apps on shutdown or if either server exits unexpectedly.
RUN <<'BUILD'
set -e
cat > /usr/local/bin/start-app <<'SCRIPT'
#!/usr/bin/env bash
set -uo pipefail
backend_pid=""
frontend_pid=""
stop_apps() {
    trap - EXIT TERM INT
    for pid in "$frontend_pid" "$backend_pid"; do
        if [[ -n "$pid" ]]; then
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done
    wait || true
}
trap stop_apps EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
export PANAMA_SINGLE_CONTAINER=true API_INTERNAL_URL=http://127.0.0.1:8000
(
    cd /app/Backend || exit 1
    exec uvicorn app.main:create_app --factory --host 127.0.0.1 --port 8000 --timeout-graceful-shutdown 20
) &
backend_pid=$!
(
    cd /app/Frontend || exit 1
    HOSTNAME=0.0.0.0 exec node server.js
) &
frontend_pid=$!
wait -n "$backend_pid" "$frontend_pid"
status=$?
if [[ "$status" -eq 0 ]]; then
    status=1
fi
exit "$status"
SCRIPT
chmod 0555 /usr/local/bin/start-app
BUILD

USER app
EXPOSE 10000
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/usr/local/bin/start-app"]
