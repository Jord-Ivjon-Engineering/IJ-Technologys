-- 0003_crm_projects.sql
-- Client projects: the unit the studio quotes, delivers, and reports on.
-- total_cost is denormalized here and kept in sync by a trigger in 0004.

create table if not exists public.crm_projects (
  id                uuid        primary key default gen_random_uuid(),
  client_id         uuid        references public.clients (id) on delete set null,
  name              text        not null check (char_length(name) between 1 and 200),
  status            text        not null default 'inquiry'
                                check (status in ('inquiry', 'scoping', 'active',
                                                  'review', 'done', 'maintenance')),
  package_tier      text,
  quoted_amount     numeric(12, 2),
  agreed_revenue    numeric(12, 2),
  -- Denormalized sum of project_costs.amount. Never write this by hand from the
  -- API; the trigger in 0004_project_costs.sql owns it.
  total_cost        numeric(12, 2) not null default 0,
  start_date        date,
  due_date          date,
  -- When true, this real project may be surfaced on the public portfolio.
  showcase_featured boolean     not null default false,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- The dashboard/finance views filter projects by client and by status.
create index if not exists crm_projects_client_status_idx
  on public.crm_projects (client_id, status);

drop trigger if exists crm_projects_set_updated_at on public.crm_projects;
create trigger crm_projects_set_updated_at
  before update on public.crm_projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: internal. Admins only.
-- ---------------------------------------------------------------------------
alter table public.crm_projects enable row level security;

drop policy if exists "admins manage projects" on public.crm_projects;
create policy "admins manage projects"
  on public.crm_projects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
