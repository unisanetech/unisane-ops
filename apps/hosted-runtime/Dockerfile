FROM node:22-bookworm-slim AS build-base

ARG TURBO_VERSION=2.6.3

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable
RUN npm install --global "turbo@${TURBO_VERSION}"

FROM build-base AS pruner

WORKDIR /repo

COPY . .

RUN turbo prune --docker --scope=@unisane/ops-hosted-runtime --out-dir /tmp/pruned

FROM build-base AS builder

WORKDIR /repo

COPY --from=pruner /tmp/pruned/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=pruner /tmp/pruned/full/ .
RUN pnpm --filter @unisane/ops-hosted-runtime... run build
RUN pnpm --filter @unisane/ops-hosted-runtime deploy --prod --legacy /runtime

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder --chown=node:node /runtime/ ./

USER 1000:1000

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=12 CMD node -e "fetch('http://127.0.0.1:8080/ready').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"

CMD ["node", "dist/bin/gateway.js"]

FROM runtime AS integration

COPY --chown=node:node unisane-ops/apps/hosted-runtime/test-fixtures/ ./test-fixtures/
