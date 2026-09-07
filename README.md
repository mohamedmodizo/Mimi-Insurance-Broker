# Mimi Insurance Agency Portal

Secure mobile-first 24/7 insurance client assistance and claims portal for market validation.

## What It Does

- Client access link for after-hours assistance
- Guided claim intake with dynamic insurance questions
- Document upload for claim evidence and forms
- Broker-controlled FAQ/knowledge base answers
- Automatic case creation, broker summaries, tasks, notifications, and audit history
- Broker dashboard with MFA login
- Combined client/broker access route at `/access/demo-secure-link-2026`

The assistant is intentionally guarded: it must not decide coverage, claim approval, payout amount, legal liability, or final policy interpretation.

## Local Docker Run

```bash
docker compose up --build -d
```

Open:

- Client/broker choice: `http://localhost:8080/access/demo-secure-link-2026`
- Client portal: `http://localhost:8080/portal/demo-secure-link-2026`
- Broker login: `http://localhost:8080/broker/login`

For a temporary external test link while the laptop is on:

```bash
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml logs --tail=80 tunnel
```

## Local Development

```bash
pnpm install
pnpm db:init
pnpm db:seed
pnpm dev
```

## Validation

```bash
pnpm typecheck
pnpm build
APP_URL=http://localhost:8080 pnpm smoke
```

On Windows PowerShell:

```powershell
$env:APP_URL = "http://localhost:8080"; pnpm smoke
```

## Cloud Deployment

For a real 24/7 market-validation link, deploy to a cloud host with:

- Managed Postgres database
- Private object storage for uploads
- Production environment variables

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Vercel deployment checklist.

Do not use real client data until MFA enrollment, malware scanning, data retention, privacy policy, backups, and production notification providers are configured.
