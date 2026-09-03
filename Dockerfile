FROM node:22-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder

ENV DATABASE_URL="postgresql://insurance_portal:insurance_portal@db:5432/insurance_portal?schema=public"

COPY app ./app
COPY components ./components
COPY lib ./lib
COPY prisma ./prisma
COPY public ./public
COPY scripts ./scripts
COPY next-env.d.ts next.config.ts tsconfig.json ./

RUN pnpm build

FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL="postgresql://insurance_portal:insurance_portal@db:5432/insurance_portal?schema=public"
ENV UPLOAD_STORAGE_DIR="/data/uploads"
ENV SESSION_COOKIE_NAME="insurance_portal_session"
ENV BROKER_DEMO_EMAIL="broker@example.com"
ENV BROKER_DEMO_PASSWORD="BrokerDemo!2026"
ENV BROKER_DEMO_TOTP_SECRET="JBSWY3DPEHPK3PXP"
ENV ENABLE_DEMO_LOGIN="false"
ENV ENABLE_DEMO_MFA_HELPER="true"

COPY --from=builder /app /app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["sh", "-c", "mkdir -p /data/uploads && pnpm db:init && pnpm db:seed && pnpm start"]
