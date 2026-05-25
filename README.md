# Sahi Review

A QR-code review-collection SaaS for Pakistani SMBs.
Happy customers (4★+) get a one-tap path to post on Google.
Unhappy ones reach the owner privately before posting a bad public review.

## Stack
- Next.js 16 (App Router, Turbopack)
- Tailwind CSS v4
- Supabase (Postgres + Auth + RLS)
- Vercel (deploy)

## Local development

### 1. Install deps
```bash
npm install
```

### 2. Start local Supabase (requires Docker Desktop running)
```bash
npx supabase start
```
Note the `anon key` and `service_role key` from the output.

### 3. Apply migrations + seed
```bash
npx supabase db reset
```

### 4. Configure env
```bash
cp .env.local.example .env.local
# Edit .env.local with the keys from `supabase start`
```

### 5. Run the app
```bash
npm run dev
```

Open:
- http://localhost:3000 — landing page
- http://localhost:3000/r/demo — customer feedback form (demo business)
- http://localhost:54323 — Supabase Studio

## Project structure
```
src/
  app/
    page.tsx                       landing
    r/[slug]/                      customer feedback flow
      page.tsx                     form page
      feedback-form.tsx            client form component
      thanks-google/               4★+ redirect to Google
      thanks-private/              <4★ private confirmation
    api/feedback/route.ts          submission endpoint
  lib/
    supabase/{client,server,admin}.ts
    validation.ts                  zod schemas
    utils.ts                       cn + sha256
supabase/
  migrations/                      Postgres schema + RLS
  seed.sql                         demo business
docs/                              foundation docs (strategy, scope, architecture, schema)
```

## Roadmap

See [`../docs/`](../docs/) for the master plan. Next phases:
- Phase 3: Business dashboard
- Phase 4: Admin panel
- Phase 5: Auth hardening
- Phase 6: Tests + security audit
- Phase 7: Deploy
- Phase 8: Landing + GTM
