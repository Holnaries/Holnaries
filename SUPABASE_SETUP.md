# Connect Honlaris to Supabase

The website is a static Vite/React build (`dist/public`). It can display bundled starter content before Supabase is connected. Once configured, the homepage reads the shared `home` record; approved admin edits are saved to Supabase and shown to visitors. The browser uses only the Supabase project URL and its public anon/publishable key. Never enter a Supabase `service_role` key in the website.

## 1. Create the tables and media bucket

In your Supabase project, open **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql). This creates the homepage-content table, an admin allow-list, row-level security policies, and a public `site-media` bucket. Visitors can read website copy and public photos, while only allow-listed admins can change copy or upload media.

## 2. Create the first admin

In **Authentication → Users**, create an email/password user for the person who will administer the site. Copy that user's UUID. In SQL Editor, run the statement below with that UUID substituted:

```sql
insert into public.admin_users (user_id)
values ('PASTE_AUTH_USER_UUID_HERE')
on conflict (user_id) do nothing;
```

Only UUIDs explicitly added to `admin_users` are permitted to edit. Admin membership is managed in Supabase, not through the public site.

## 3. Add public Supabase settings

Set these browser-safe values in the static site's build environment (or in a local `.env.local` file for local development):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
```

Find them in **Project Settings → API**. These two values are public-facing; Supabase RLS is the security boundary. Never use the `service_role` key. Rebuild/redeploy the static site after changing them. Then open `/admin`, sign in, edit content, and save. The first successful save creates the `home` row.

For a local preview, install the committed dependencies, put those values in `.env.local`, and run `pnpm dev:static`. The declared static build runs `pnpm install --frozen-lockfile && pnpm build:static` and outputs to `dist/public`. The published route configuration includes an SPA fallback for direct navigation to `/admin`.

## 4. Complete launch content

The default contact details and map URL are blank. Add the real clinic phone, email, address, hours, and map destination from the admin panel. Privacy and terms links remain hidden until both their labels and page destinations have been set. The sample patient stories start hidden: replace them with genuine patient-approved copy before making any story visible. Do not present illustrative copy as a real clinical outcome or patient endorsement.

The initial custom photos use local asset paths. For a static host, upload final approved photos to the Supabase `site-media` bucket from the admin panel and use those URLs before deployment. Do not publish or reuse a patient's photo without permission.

## Security notes

The admin screen checks the authenticated user's UUID against `admin_users`; SQL policies independently enforce the same restriction. Do not disable row-level security. The website stores marketing content only, not patient records. Review the policies against your actual Supabase project before launch.
