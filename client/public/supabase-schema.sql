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
  email text,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  created_at timestamptz not null default now()
);

-- Upgrade path for projects that ran an older version of this schema:
alter table public.admin_users
  add column if not exists role text not null default 'admin'
  check (role in ('admin', 'super_admin'));
alter table public.admin_users
  add column if not exists email text;

-- Backfill email from auth.users (run as project owner):
update public.admin_users a
set email = u.email
from auth.users u
where a.user_id = u.id and (a.email is null or a.email = '');

-- Helper functions (SECURITY DEFINER) to avoid infinite recursion in RLS:
-- policies on admin_users must not subquery admin_users directly.
create or replace function public.is_site_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = uid);
$$;

create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = uid and role = 'super_admin');
$$;

grant execute on function public.is_site_admin(uuid) to anon, authenticated;
grant execute on function public.is_super_admin(uuid) to anon, authenticated;

alter table public.site_content enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Anyone can read published site content" on public.site_content;
create policy "Anyone can read published site content"
  on public.site_content for select
  using (true);

drop policy if exists "Admins can insert site content" on public.site_content;
create policy "Admins can insert site content"
  on public.site_content for insert to authenticated
  with check (public.is_site_admin((select auth.uid())));

drop policy if exists "Admins can update site content" on public.site_content;
create policy "Admins can update site content"
  on public.site_content for update to authenticated
  using (public.is_site_admin((select auth.uid())))
  with check (public.is_site_admin((select auth.uid())));

drop policy if exists "Admins can see their own admin record" on public.admin_users;
drop policy if exists "Admins can read admin records" on public.admin_users;
create policy "Admins can read admin records"
  on public.admin_users for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_super_admin((select auth.uid()))
  );

drop policy if exists "Super admins can add admins" on public.admin_users;
create policy "Super admins can add admins"
  on public.admin_users for insert to authenticated
  with check (
    public.is_super_admin((select auth.uid()))
    and role = 'admin'
  );

drop policy if exists "Super admins can remove admins" on public.admin_users;
create policy "Super admins can remove admins"
  on public.admin_users for delete to authenticated
  using (
    public.is_super_admin((select auth.uid()))
    and role = 'admin'
  );

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
    and public.is_site_admin((select auth.uid()))
  );

drop policy if exists "Admins can update Honlaris media" on storage.objects;
create policy "Admins can update Honlaris media"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'site-media'
    and public.is_site_admin((select auth.uid()))
  )
  with check (
    bucket_id = 'site-media'
    and public.is_site_admin((select auth.uid()))
  );

drop policy if exists "Admins can delete Honlaris media" on storage.objects;
create policy "Admins can delete Honlaris media"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'site-media'
    and public.is_site_admin((select auth.uid()))
  );

-- After creating the first user under Authentication > Users, promote that account
-- to super admin (run once, as the project owner):
-- insert into public.admin_users (user_id, role)
-- values ('PASTE_AUTH_USER_UUID_HERE', 'super_admin')
-- on conflict (user_id) do update set role = 'super_admin';
--
-- Additional admins can then be added from the website's admin panel (Security tab)
-- or directly:
-- insert into public.admin_users (user_id, role)
-- values ('PASTE_AUTH_USER_UUID_HERE', 'admin')
-- on conflict (user_id) do nothing;
