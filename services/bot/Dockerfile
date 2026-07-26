ARG VERSION=dev

# ---------- BASE ----------
FROM node:22 AS base

WORKDIR /usr/src/app

COPY shared ./shared
COPY proto ./proto

COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

COPY services/bot/package*.json ./services/bot/
COPY services/bot/jest.config.js ./services/bot/
COPY services/bot/tsconfig.json ./services/bot/
COPY services/bot/src ./services/bot/src/
COPY services/bot/__tests__ ./services/bot/__tests__/
COPY services/bot/prisma ./services/bot/prisma/

RUN apt-get update && apt-get install -y protobuf-compiler

RUN corepack enable && corepack prepare pnpm@11.9.0 --activate


# ---------- DEPS ----------
FROM base AS deps

RUN pnpm fetch
RUN pnpm install --offline --frozen-lockfile

RUN mkdir -p ./services/bot/src/grpc/generated
RUN pnpm --filter bot proto:generate

RUN pnpm --filter bot prisma:generate

# ---------- DEV ----------
FROM deps AS dev

COPY services/bot/tsconfig.test.json ./services/bot/

ENV NODE_ENV=development

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 50051

CMD ["pnpm", "--filter", "bot", "dev"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 50051 || exit 1

# ---------- BUILD ----------
FROM deps AS build

ENV NODE_ENV=production

RUN pnpm --filter @shared/logger build
RUN pnpm --filter @shared/grpc-client-manager build
RUN pnpm --filter @shared/kafka-manager build
RUN pnpm --filter @shared/pg-boss-manager build

RUN pnpm --filter bot build

RUN pnpm --filter bot deploy /deploy --prod

# ---------- PROD ----------
FROM node:22 AS prod

ARG VERSION=dev

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY --from=build /deploy .

RUN printf "%s\n" "$VERSION" > VERSION

LABEL org.opencontainers.image.version="$VERSION"

USER node

EXPOSE 50051

CMD ["node", "dist/app.js"]

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD nc -z localhost 50051 || exit 1

# ---------- PREDEPLOY ----------
FROM build AS predeploy

ARG VERSION=dev

WORKDIR /usr/src/app

RUN printf "%s\n" "$VERSION" > VERSION

LABEL org.opencontainers.image.version="$VERSION"

WORKDIR /usr/src/app/services/bot
CMD ["npx", "prisma", "migrate", "deploy", "--schema=prisma/schema.prisma"]
