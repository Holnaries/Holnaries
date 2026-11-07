# Honlaris Wellness

Website and booking system for the Honlaris Wellness skin and aesthetics clinic.

## Stack

- **Client:** React 19, Vite, Wouter
- **Server:** Express (local / self-hosted)
- **Data:** Supabase (page content, admin sign-in, image storage, bookings)
- **Hosting:** Vercel (static build + serverless `api/` functions)

## Local development

```bash
pnpm install
pnpm dev        # http://localhost:3001
```

Set `PORT=3001` in `.env` first. Port 3000 is reserved for another app.

Other scripts:

| Command | Purpose |
| --- | --- |
| `pnpm check` | TypeScript type check |
| `pnpm test` | Unit tests |
| `pnpm build` | Build client + server into `dist/` |
| `pnpm start` | Serve the production build |
| `pnpm build:static` | Build the client only (Vercel) |

## Environment

Create `.env` (never committed):

```bash
PORT=3001
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon / publishable key>
```

Only the public anon/publishable key belongs in the client. Row-level security
in Supabase protects all writes.

## Database setup

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor. It
creates `site_content`, `admin_users` and `bookings`, enables row-level
security, and creates the public `site-media` storage bucket.

Admin access is an allow-list: an account can open `/admin` only if its user id
is present in `public.admin_users`. Create the account in
**Authentication → Users**, confirm its email, then run:

```sql
insert into public.admin_users (user_id, email)
select id, email from auth.users
where lower(email) = lower('you@example.com')
on conflict (user_id) do update set email = excluded.email;
```

## Booking API

`api/bookings.ts` and `api/bookings/[id].ts` are self-contained Vercel
functions:

- `POST /api/bookings` — public, creates a request
- `GET /api/bookings` — admin only, lists requests
- `PATCH /api/bookings/:id` — admin only, marks handled / reopened
- `DELETE /api/bookings/:id` — admin only

Admin requests carry the Supabase access token as a `Bearer` header; the
functions verify the token and the `admin_users` allow-list on every call.

## Deployment

Deployed on Vercel (project `honlaris`). Set `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL` and `SUPABASE_ANON_KEY` for the
Production, Preview and Development environments, then deploy:

```bash
vercel --prod
```
