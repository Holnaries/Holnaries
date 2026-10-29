-- Honlaris Wellness static CMS schema for Supabase.
-- Run this SQL in the Supabase SQL Editor using the project owner role.

create table if not exists public.site_content (
  id text primary key check (id = 'home'),
  content jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Anyone can read published site content" on public.site_content;
create policy "Anyone can read published site content"
  on public.site_content for select
  using (true);

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
  on public.site_content for insert to authenticated
  with check (exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  ));

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
  on public.site_content for update to authenticated
  using (exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  ));

drop policy if exists "Admins can see their own admin record" on public.admin_users;
create policy "Admins can see their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
grant select on public.admin_users to authenticated;

-- Create the public bucket used for admin-uploaded website images.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = true;

grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;

drop policy if exists "Public can view Honlaris media" on storage.objects;
create policy "Public can view Honlaris media"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'site-media');

drop policy if exists "Admins can upload Honlaris media" on storage.objects;
create policy "Admins can upload Honlaris media"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  );

drop policy if exists "Admins can update Honlaris media" on storage.objects;
create policy "Admins can update Honlaris media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'site-media'
    and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  )
  with check (
    bucket_id = 'site-media'
    and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  );

drop policy if exists "Admins can delete Honlaris media" on storage.objects;
create policy "Admins can delete Honlaris media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'site-media'
    and exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
  );

-- After creating the first user under Authentication > Users, promote that account:
-- insert into public.admin_users (user_id)
-- values ('PASTE_AUTH_USER_UUID_HERE')
-- on conflict (user_id) do nothing;
