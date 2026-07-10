-- 0001_admin_and_helpers.sql
-- Auth/access layer + shared helpers for the CRM.
--
-- Introduces:
--   * admin_profiles       — explicit allow-list of team members (FK -> auth.users)
--   * is_admin()           — SECURITY DEFINER guard used by every CRM/CMS RLS policy
--   * set_updated_at()     — shared trigger fn that stamps updated_at on write
--
-- Run order: apply the numbered migrations in this folder in ascending order,
-- after backend/db/reviews.sql (which creates the reviews table).

-- ---------------------------------------------------------------------------
-- admin_profiles: who is allowed into the CRM.
-- A row here is the ONLY thing that grants admin access; creating an auth.users
-- record alone does nothing. Seed the first admin manually (see repo docs).
-- ---------------------------------------------------------------------------
create table if not exists public.admin_profiles (
  user_id      uuid        primary key references auth.users (id) on delete cascade,
  display_name text        not null default '',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- is_admin(): true when the current JWT belongs to a listed admin.
--
-- SECURITY DEFINER + a pinned search_path let this read admin_profiles while
-- BYPASSING that table's RLS. Without it, an admin_profiles policy that calls
-- is_admin() would recurse into itself.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_profiles where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- set_updated_at(): reusable BEFORE UPDATE trigger fn. Attached by later
-- migrations to every table that carries an updated_at column.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS: admins manage the allow-list; a user may read their own row so the CRM
-- can confirm "am I an admin?" without exposing the whole team table.
-- ---------------------------------------------------------------------------
alter table public.admin_profiles enable row level security;

drop policy if exists "admins read all profiles" on public.admin_profiles;
create policy "admins read all profiles"
  on public.admin_profiles for select
  to authenticated
  using (public.is_admin() or user_id = auth.uid());

drop policy if exists "admins insert profiles" on public.admin_profiles;
create policy "admins insert profiles"
  on public.admin_profiles for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update profiles" on public.admin_profiles;
create policy "admins update profiles"
  on public.admin_profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete profiles" on public.admin_profiles;
create policy "admins delete profiles"
  on public.admin_profiles for delete
  to authenticated
  using (public.is_admin());
