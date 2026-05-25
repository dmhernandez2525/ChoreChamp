# Multi-stage Dockerfile for ChoreChamp API (only)
# Web client is built outside Docker by CodeBuild and uploaded to S3.
# Image target: server-production (port 3001).

FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 && corepack enable \
 && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# --- deps: install ALL workspace deps (pnpm needs the full graph to link workspace:* refs) ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/gamification/package.json ./packages/gamification/
COPY packages/types/package.json ./packages/types/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile --ignore-scripts

# --- api-builder: build the Fastify server with esbuild ---
FROM base AS api-builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages ./packages
COPY . .
RUN pnpm --filter @chorechamp/api build

# --- server-production: minimal runtime image ---
FROM base AS server-production
WORKDIR /app
COPY --from=api-builder /app/apps/api/dist                 ./apps/api/dist
COPY --from=api-builder /app/apps/api/package.json         ./apps/api/package.json
COPY --from=api-builder /app/apps/api/node_modules         ./apps/api/node_modules
COPY --from=api-builder /app/packages/database             ./packages/database
COPY --from=api-builder /app/packages/gamification         ./packages/gamification
COPY --from=api-builder /app/packages/types                ./packages/types
COPY --from=api-builder /app/node_modules                  ./node_modules
COPY --from=api-builder /app/package.json /app/pnpm-workspace.yaml ./
EXPOSE 3001
WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]
