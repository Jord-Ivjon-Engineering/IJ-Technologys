-- 0009_security_hardening.sql
-- Resolves Supabase database-linter findings from the CRM schema rollout.

-- 1) Run the public content view with the querying role's rights. The narrow
--    anon "published = true" RLS policies already permit exactly what the view
--    exposes, so it no longer needs to bypass RLS as a SECURITY DEFINER view.
alter view public.public_site_content set (security_invoker = on);

-- 2) Pin search_path on our trigger functions (all table refs are already
--    schema-qualified, so an empty search_path is safe).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.sync_project_total_cost()
returns trigger
language plpgsql
set search_path = ''
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

  return null;
end;
$$;

-- 3) anon never evaluates is_admin() (no anon policy references it), so it does
--    not need EXECUTE. Keep it for authenticated, which RLS relies on.
revoke execute on function public.is_admin() from anon;
