# syntax=docker/dockerfile:1

FROM node:24.22.3-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true
RUN npm install --global npm@11.20.0

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Render supplies these public values from its Environment settings as build
# arguments and runtime variables. Never declare server secrets as build ARGs.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
RUN : "${NEXT_PUBLIC_API_URL:?Set NEXT_PUBLIC_API_URL in Render before building}" \
    && : "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:?Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY in Render before building}" \
    && mkdir -p public \
    && npm run build

FROM node:24.22.3-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_CLERK_KEYLESS_DISABLED=true \
    HOSTNAME=0.0.0.0 \
    PORT=10000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
USER node
EXPOSE 10000
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
