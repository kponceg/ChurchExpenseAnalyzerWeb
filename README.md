# Church Finance

A bilingual church finance website for recording income and expenses, managing
accounts, funds, categories, budgets, approvals, reconciliations, reports, and
organization access.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Replace every placeholder in `.env.local` with the matching Supabase value.
4. Start the website with `npm run dev`.
5. Open `http://localhost:3000`.

Never commit `.env.local`, Supabase secret keys, passwords, exported financial
data, or uploaded receipts. The repository ignores those files by default.

## Required environment variables

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server | Supabase publishable key used by signed-in users |
| `SUPABASE_SECRET_KEY` | Server only | Administrative invitations and password-reset emails |
| `NEXT_PUBLIC_SITE_URL` | Browser and server | Canonical website origin used in email redirect links |

`SUPABASE_SECRET_KEY` must never be exposed in client code or renamed with a
`NEXT_PUBLIC_` prefix.

## Deploy to Vercel

1. Import the GitHub repository into Vercel.
2. Keep the detected framework set to **Next.js** and use the default build
   command, `npm run build`.
3. Add all four variables from `.env.example` in **Project Settings →
   Environment Variables**. Add them to Production, Preview, and Development as
   appropriate.
4. Set `NEXT_PUBLIC_SITE_URL` to the production origin, for example
   `https://church-finance.vercel.app`, without a trailing slash.
5. Deploy the project and copy its final production URL.
6. If a custom domain is added later, update `NEXT_PUBLIC_SITE_URL`, redeploy,
   and update the Supabase URLs below.

## Configure Supabase for the deployed website

In **Supabase → Authentication → URL Configuration**:

- Set **Site URL** to the production website origin.
- Add these **Redirect URLs**:
  - `https://your-app.vercel.app/auth/callback`
  - `https://your-app.vercel.app/auth/invite`
  - `https://your-app.vercel.app/auth/reset`
- Keep the equivalent `http://localhost:3000` redirect URLs while local
  development is still needed.

Use the exact production domain in both Vercel and Supabase. A mismatch between
`www` and a bare domain, an old Vercel URL, or an incorrect protocol can make
invitation and password-reset links appear invalid.

## Pre-deployment verification

Run:

```bash
npm run typecheck
npm test
npm run test:e2e
```

After deployment, verify sign-in, invitations, password reset, role permissions,
transaction attachments, PDF downloads, and English/Spanish switching using
test accounts before entering production financial data.
