# Implementation Handoff

## Local URLs

- Client portal: http://localhost:3000/portal/demo-secure-link-2026
- Broker login: http://localhost:3000/broker/login
- Product entry screen: http://localhost:3000

## Demo Broker Login

- Email: `broker@example.com`
- Password: `BrokerDemo!2026`
- MFA: run `pnpm otp` to print the current six-digit demo code.
- Local shortcut: click `Use Demo Broker Login` on the login screen. This endpoint is disabled when `NODE_ENV=production`.

## Useful Commands

- Install dependencies: `pnpm install`
- Initialize local SQLite schema: `pnpm db:init`
- Seed demo data: `pnpm db:seed`
- Reset local database: `pnpm db:reset`
- Typecheck: `pnpm typecheck`
- Production build: `pnpm build`
- End-to-end smoke test: `pnpm smoke`
- Development server: `pnpm dev`
- Docker local host: `docker compose up --build -d app`
- Docker public test tunnel: `docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d --build`

## What Is Implemented

The MVP includes secure client links, guided claim intake, dynamic claim questions, upload progress, file validation, case creation, broker summaries, automatic tasks, queued notifications, broker MFA login, dashboard, case management, broker notes, audit history, client status lookup, approved knowledge-base answers, and policy-question escalation.

## Production Notes

Before live deployment, replace SQLite with PostgreSQL, move attachments to private object storage with malware scanning, configure HTTPS/HSTS at the edge, rotate all secrets, connect real email/SMS/WhatsApp providers, enforce country-specific privacy controls, and replace the demo broker credentials.

## Docker Test Hosting

The Docker app listens on http://localhost:8080. Anyone on the same local network may be able to test through `http://<your-lan-ip>:8080/portal/demo-secure-link-2026` if your firewall/router allows it.

For a temporary public test link, use the Cloudflare quick tunnel compose overlay and read the tunnel logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml logs -f tunnel
```

Share only the `/portal/demo-secure-link-2026` link for client testing. Do not share broker login details. The demo login shortcut is disabled inside the production Docker container.
