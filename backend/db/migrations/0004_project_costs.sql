-- 0004_project_costs.sql
-- Per-project cost line items (hosting, tools, contractors, ...).
-- A trigger keeps crm_projects.total_cost equal to the sum of its costs so the
-- dashboard/finance queries never have to aggregate on the hot path.

create table if not exists public.project_costs (
  id          uuid        primary key default gen_random_uuid(),
  project_id  uuid        not null references public.crm_projects (id) on delete cascade,
  label       text        not null check (char_length(label) between 1 and 200),
  amount      numeric(12, 2) not null default 0,
  category    text        not null default 'other'
                          check (category in ('hosting', 'tools', 'contractor', 'other')),
  incurred_at date        not null default current_date,
  created_at  timestamptz not null default now()
);

create index if not exists project_costs_project_idx
  on public.project_costs (project_id);

-- ---------------------------------------------------------------------------
-- Keep crm_projects.total_cost in sync with SUM(project_costs.amount).
-- Recomputes for every project touched by the change (handles INSERT, UPDATE
-- including a project_id move, and DELETE).
-- ---------------------------------------------------------------------------
create or replace function public.sync_project_total_cost()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    update public.crm_projects p
       set total_cost = coalesce(
             (select sum(c.amount) from public.project_costs c
               where c.project_id = old.project_id), 0)
     where p.id = old.project_id;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    update public.crm_projects p
       set total_cost = coalesce(
             (select sum(c.amount) from public.project_costs c
               where c.project_id = new.project_id), 0)
     where p.id = new.project_id;
  end if;

  return null; -- AFTER trigger; return value ignored
end;
$$;

drop trigger if exists project_costs_sync_total on public.project_costs;
create trigger project_costs_sync_total
  after insert or update or delete on public.project_costs
  for each row execute function public.sync_project_total_cost();

-- ---------------------------------------------------------------------------
-- RLS: internal. Admins only.
-- ---------------------------------------------------------------------------
alter table public.project_costs enable row level security;

drop policy if exists "admins manage project costs" on public.project_costs;
create policy "admins manage project costs"
  on public.project_costs for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
