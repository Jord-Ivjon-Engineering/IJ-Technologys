create or replace function public.crm_dashboard_stats()
returns json
language sql
stable
as $$
  select json_build_object(
    'newLeads', (
      select count(*)::int
      from public.contact_submissions
      where status = 'new'
    ),
    'activeProjects', (
      select count(*)::int
      from public.crm_projects
      where status in ('active', 'scoping', 'review')
    ),
    'totalRevenue', (
      select coalesce(sum(agreed_revenue), 0)
      from public.crm_projects
    ),
    'totalCost', (
      select coalesce(sum(total_cost), 0)
      from public.crm_projects
    ),
    'pendingReviews', (
      select count(*)::int
      from public.reviews
      where not approved
    ),
    'totalClients', (
      select count(*)::int
      from public.clients
    ),
    'leadClients', (
      select count(*)::int
      from public.clients
      where status = 'lead'
    )
  );
$$;

create or replace function public.crm_finance_summary()
returns json
language sql
stable
as $$
  select json_build_object(
    'totals', json_build_object(
      'revenue', (select coalesce(sum(agreed_revenue), 0) from public.crm_projects),
      'cost', (select coalesce(sum(total_cost), 0) from public.crm_projects),
      'margin', (
        select coalesce(sum(agreed_revenue), 0) - coalesce(sum(total_cost), 0)
        from public.crm_projects
      )
    ),
    'byMonth', (
      select coalesce(json_agg(row_to_json(m) order by m.month), '[]'::json)
      from (
        select
          to_char(date_trunc('month', incurred_at), 'YYYY-MM') as month,
          coalesce(sum(amount), 0) as cost
        from public.project_costs
        group by date_trunc('month', incurred_at)
      ) m
    ),
    'revenueByMonth', (
      select coalesce(json_agg(row_to_json(m) order by m.month), '[]'::json)
      from (
        select
          to_char(date_trunc('month', coalesce(start_date, created_at::date)), 'YYYY-MM') as month,
          coalesce(sum(agreed_revenue), 0) as revenue
        from public.crm_projects
        where agreed_revenue > 0
        group by date_trunc('month', coalesce(start_date, created_at::date))
      ) m
    ),
    'byProject', (
      select coalesce(json_agg(row_to_json(p) order by p.name), '[]'::json)
      from (
        select
          id,
          name,
          agreed_revenue as revenue,
          total_cost as cost,
          agreed_revenue - total_cost as margin,
          status
        from public.crm_projects
      ) p
    )
  );
$$;
