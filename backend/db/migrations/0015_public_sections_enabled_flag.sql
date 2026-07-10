create or replace view public.public_site_content as
select
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

  coalesce((
    select jsonb_agg(
             jsonb_build_object(
               'slug',    ss.slug,
               'enabled', ss.enabled,
               'content', ss.content
             )
             order by ss.sort_order, ss.created_at
           )
    from public.site_sections ss
  ), '[]'::jsonb) as sections;

grant select on public.public_site_content to anon, authenticated;
