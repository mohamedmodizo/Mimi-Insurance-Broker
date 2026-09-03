# 24/7 Market Validation Deployment

This portal is designed to run as a cloud-hosted Next.js app with managed Postgres for records and private object storage for uploaded claim documents.

## Target Stack

- Hosting: Vercel, production deployment
- Database: managed Postgres, preferably Neon through the Vercel Marketplace
- File storage: Vercel Blob with private uploads
- ORM: Prisma
- Runtime: Next.js App Router route handlers

The local Docker setup remains useful for testing, but it is not a permanent public host. A Cloudflare quick tunnel is only for temporary test sharing while the laptop is on.

## Required Vercel Resources

Create or connect these resources in the Vercel dashboard for this project:

1. A managed Postgres database.
2. A private Vercel Blob store.

The app expects these environment variables in Vercel:

```env
DATABASE_URL="postgresql://..."
BLOB_READ_WRITE_TOKEN="vercel_blob_..."
SESSION_COOKIE_NAME="insurance_portal_session"
BROKER_DEMO_EMAIL="broker@example.com"
BROKER_DEMO_PASSWORD="replace-with-a-strong-validation-password"
BROKER_DEMO_TOTP_SECRET="replace-with-a-base32-totp-secret"
ENABLE_DEMO_LOGIN="false"
ENABLE_DEMO_MFA_HELPER="true"
```

For live client data, set `ENABLE_DEMO_MFA_HELPER="false"` and use a real MFA enrollment flow before launch.

## Build Behavior

Vercel uses `vercel.json`:

```json
{
  "buildCommand": "pnpm build:cloud",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

`pnpm build:cloud` performs:

1. Prisma client generation.
2. Database schema push.
3. Demo seed data creation.
4. Next.js production build.

This is acceptable for market validation. For a production insurance deployment, replace `prisma db push` with audited migrations.

## Validation Links

After deployment, use:

- Combined access link: `https://YOUR-VERCEL-DOMAIN/access/demo-secure-link-2026`
- Client portal: `https://YOUR-VERCEL-DOMAIN/portal/demo-secure-link-2026`
- Broker login: `https://YOUR-VERCEL-DOMAIN/broker/login`

## Post-Deploy Smoke Test

Set `APP_URL` to the production URL and run:

```bash
APP_URL=https://YOUR-VERCEL-DOMAIN pnpm smoke
```

The smoke test verifies:

- Document upload
- Claim creation
- FAQ response
- Broker MFA login
- Broker dashboard rendering

## Security Notes

- Do not use real client data until the domain, MFA, retention, backups, malware scanning, and privacy policy are configured.
- Keep Blob uploads private.
- Never commit `.env`, `.env.local`, or `.vercel`.
- Rotate demo passwords and TOTP secrets before sharing the validation link externally.
