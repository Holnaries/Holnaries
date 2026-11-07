-- Honlaris Wellness CMS schema for Supabase.
-- Run this SQL in the Supabase SQL Editor using the project owner role.
--
-- Admin access is a single role: an account is either an admin (listed in
-- public.admin_users) or it is not. There are no super admins and the website
-- no longer creates admins -- accounts are created in Supabase itself.

create table if not exists public.site_content (
  id text primary key check (id = 'home'),
  content jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

-- Upgrade path for projects that ran an older version of this schema:
alter table public.admin_users add column if not exists email text;

-- Backfill email from auth.users (run as project owner):
update public.admin_users a
set email = u.email
from auth.users u
where a.user_id = u.id and (a.email is null or a.email = '');

-- Helper function (SECURITY DEFINER) to avoid infinite recursion in RLS:
-- policies on admin_users must not subquery admin_users directly.
create or replace function public.is_site_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = uid);
$$;

grant execute on function public.is_site_admin(uuid) to anon, authenticated;

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

-- An admin can only read their own record, which is all the site needs to
-- confirm access. Adding or removing admin records is done from Supabase.
drop policy if exists "Admins can see their own admin record" on public.admin_users;
drop policy if exists "Admins can read admin records" on public.admin_users;
create policy "Admins can see their own admin record"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Super admins can add admins" on public.admin_users;
drop policy if exists "Super admins can remove admins" on public.admin_users;

-- Older versions of this schema used a super-admin role; remove the leftovers.
drop function if exists public.is_super_admin(uuid);

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;
grant select on public.admin_users to authenticated;

-- Consultation requests submitted from the public booking form.
create table if not exists public.bookings (
  id text primary key,
  name text not null,
  phone text not null,
  service text not null,
  date date not null,
  time text not null,
  note text,
  status text not null default 'new' check (status in ('new', 'done')),
  created_at timestamptz not null default now()
);

create index if not exists bookings_created_at_idx
  on public.bookings (created_at desc);

alter table public.bookings enable row level security;

-- Visitors may only create a request; they can never read requests back.
drop policy if exists "Anyone can create a consultation request" on public.bookings;
create policy "Anyone can create a consultation request"
  on public.bookings for insert to anon, authenticated
  with check (status = 'new');

-- Only signed-in site admins can read or manage requests.
drop policy if exists "Admins can read consultation requests" on public.bookings;
create policy "Admins can read consultation requests"
  on public.bookings for select to authenticated
  using (public.is_site_admin((select auth.uid())));

drop policy if exists "Admins can update consultation requests" on public.bookings;
create policy "Admins can update consultation requests"
  on public.bookings for update to authenticated
  using (public.is_site_admin((select auth.uid())))
  with check (public.is_site_admin((select auth.uid())));

drop policy if exists "Admins can delete consultation requests" on public.bookings;
create policy "Admins can delete consultation requests"
  on public.bookings for delete to authenticated
  using (public.is_site_admin((select auth.uid())));

grant insert on public.bookings to anon, authenticated;
grant select, update, delete on public.bookings to authenticated;

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

-- Setup (one time, as project owner):
-- 1. Create the admin account in Authentication > Users (email + password).
--    If it was created by signing up, confirm it (Authentication > Users >
--    the user > "Confirm email", or enable "Auto Confirm User").
-- 2. Allow it to sign in to /admin by adding it to admin_users:
--
--   insert into public.admin_users (user_id, email)
--   select id, email from auth.users
--   where email = 'you@example.com'
--   on conflict (user_id) do update set email = excluded.email;

