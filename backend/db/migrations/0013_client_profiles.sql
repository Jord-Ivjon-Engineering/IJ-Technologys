-- 0013_client_profiles.sql
-- Links Supabase Auth users to CRM client records for the client portal login.

create table if not exists public.client_profiles (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  client_id  uuid        not null references public.clients (id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists client_profiles_client_id_idx
  on public.client_profiles (client_id);

alter table public.client_profiles enable row level security;

drop policy if exists "admins manage client profiles" on public.client_profiles;
create policy "admins manage client profiles"
  on public.client_profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "clients read own profile" on public.client_profiles;
create policy "clients read own profile"
  on public.client_profiles for select
  to authenticated
  using (user_id = auth.uid());
