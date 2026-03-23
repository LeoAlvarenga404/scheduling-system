FROM oven/bun:1.2.22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM deps AS build
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY vitest.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN bun run prisma:generate
RUN bun run build

FROM oven/bun:1.2.22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/bun.lock ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist

USER bun
EXPOSE 3000

CMD ["bun", "dist/main.js"]