FROM oven/bun:1.3.14 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
COPY apps/realtime/package.json ./apps/realtime/
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
RUN bun install --frozen-lockfile

FROM install AS builder
COPY . .

# Inlined into the client bundle at build time - must match the public URL
# the browser will use to reach the realtime service (e.g. wss://realtime.example.com/ws).
ARG NEXT_PUBLIC_REALTIME_WS_URL=ws://localhost:3001/ws
ENV NEXT_PUBLIC_REALTIME_WS_URL=${NEXT_PUBLIC_REALTIME_WS_URL}

# Only need to satisfy module-load-time checks (e.g. @repo/db throws if unset)
# during `next build`. Real values are supplied at container runtime.
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV AUTH_SECRET=build-time-placeholder-secret
ENV AUTH_URL=http://localhost:3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN bunx turbo run build --filter=web

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app .
WORKDIR /app/apps/web

EXPOSE 3000
CMD ["bunx", "next", "start", "--hostname", "0.0.0.0", "--port", "3000"]
