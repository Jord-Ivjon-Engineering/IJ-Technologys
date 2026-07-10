-- 0007_public_site_content_view.sql
-- One security-definer view that assembles the entire published marketing site
-- payload, so GET /api/content/public is a single round-trip.
--
-- Views run with the owner's rights (security_invoker is left at its default of
-- false), so this reads past RLS but only ever exposes rows the WHERE clauses
-- allow: published showcase/pricing, enabled sections, and the settings row.
-- Internal columns (updated_by/updated_at, published flags) are projected out.

create or replace view public.public_site_content as
select
  -- Global settings (singleton row), public fields only.
  (
    select jsonb_build_object(
      'hero',       s.hero,
      'stats',      s.stats,
      'strip',      s.strip,
      'footer',     s.footer,
      'contact',    s.contact,
      'visibility', s.visibility
    )
    from public.site_settings s
    limit 1
  ) as settings,

  -- Published portfolio cards, in display order.
  coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'id',          sp.id,
               'tag',         sp.tag,
               'title',       sp.title,
               'description', sp.description,
               'imageUrl',    sp.image_url
             )
             order by sp.sort_order, sp.created_at
           )
    from public.showcase_projects sp
    where sp.published
  ), '[]'::jsonb) as showcase,

  -- Published pricing plans, in display order.
  coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'id',          pp.id,
               'slug',        pp.slug,
               'name',        pp.name,
               'priceLabel',  pp.price_label,
               'perLabel',    pp.per_label,
               'features',    pp.features,
               'highlighted', pp.highlighted
             )
             order by pp.sort_order, pp.created_at
           )
    from public.pricing_plans pp
    where pp.published
  ), '[]'::jsonb) as pricing,

  -- Enabled section blocks, in display order.
  coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'slug',    ss.slug,
               'content', ss.content
             )
             order by ss.sort_order, ss.created_at
           )
    from public.site_sections ss
    where ss.enabled
  ), '[]'::jsonb) as sections;

-- The marketing site is anonymous, so expose the assembled payload to anon.
grant select on public.public_site_content to anon, authenticated;
