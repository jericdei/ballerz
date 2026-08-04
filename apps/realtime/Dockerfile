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

FROM base AS runner
ENV NODE_ENV=production
# Bun's isolated linker places workspace-specific deps in nested
# node_modules (apps/realtime/node_modules, packages/db/node_modules, ...),
# not just the root one, so copy the whole installed tree.
COPY --from=install /app /app
COPY . .
WORKDIR /app/apps/realtime
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3001/health').then(r=>{if(!r.ok)throw 0}).catch(()=>process.exit(1))"
CMD ["bun", "src/server.ts"]
