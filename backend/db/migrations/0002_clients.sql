-- 0002_clients.sql
-- CRM clients: leads and customers. Everything else (projects, submissions)
-- links back here.

create table if not exists public.clients (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null check (char_length(name) between 1 and 160),
  company    text,
  email      text,
  phone      text,
  status     text        not null default 'lead'
                          check (status in ('lead', 'active', 'past')),
  source     text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lookups the CRM does constantly: dedupe by email, filter the pipeline by status.
create index if not exists clients_email_idx  on public.clients (email);
create index if not exists clients_status_idx on public.clients (status);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: client records are internal. Admins only; no anon access at all.
-- ---------------------------------------------------------------------------
alter table public.clients enable row level security;

drop policy if exists "admins manage clients" on public.clients;
create policy "admins manage clients"
  on public.clients for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
