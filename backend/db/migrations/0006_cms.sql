-- 0006_cms.sql
-- Website CMS. Powers the public marketing site (frontend/index.html) from the
-- database instead of hardcoded markup. All copy is bilingual: text fields hold
-- a { "en": ..., "sq": ... } JSON object.
--
-- Public reads happen through the aggregated view in 0007; the narrow anon
-- SELECT policies here are defense in depth for any direct client access.

-- ---------------------------------------------------------------------------
-- site_settings: a single row of global site copy/config.
-- The `id boolean primary key default true check (id)` trick allows exactly one
-- row (id can only ever be true), so this is a true singleton.
-- ---------------------------------------------------------------------------
create table if not exists public.site_settings (
  id         boolean     primary key default true check (id),
  hero       jsonb       not null default '{}'::jsonb,  -- { en:{...}, sq:{...} }
  stats      jsonb       not null default '{}'::jsonb,  -- projects_launched, happy_clients, countries_reached
  strip      jsonb       not null default '{}'::jsonb,  -- marquee text
  footer     jsonb       not null default '{}'::jsonb,
  contact    jsonb       not null default '{}'::jsonb,  -- channels (email, phone, socials)
  visibility jsonb       not null default '{}'::jsonb,  -- section on/off flags
  updated_at timestamptz not null default now(),
  updated_by uuid        references auth.users (id) on delete set null
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- showcase_projects: portfolio cards orbiting the public globe.
-- ---------------------------------------------------------------------------
create table if not exists public.showcase_projects (
  id          uuid        primary key default gen_random_uuid(),
  sort_order  integer     not null default 0,
  tag         text,
  title       jsonb       not null default '{}'::jsonb,  -- { en, sq }
  description jsonb       not null default '{}'::jsonb,  -- { en, sq }
  image_url   text,
  published   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references auth.users (id) on delete set null
);

create index if not exists showcase_projects_published_sort_idx
  on public.showcase_projects (published, sort_order);

drop trigger if exists showcase_projects_set_updated_at on public.showcase_projects;
create trigger showcase_projects_set_updated_at
  before update on public.showcase_projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pricing_plans: the public pricing cards (basic / pro / premium).
-- features is a JSON array of bilingual strings: [ { en, sq }, ... ].
-- ---------------------------------------------------------------------------
create table if not exists public.pricing_plans (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        jsonb       not null default '{}'::jsonb,  -- { en, sq }
  price_label text,                                       -- e.g. "€290"
  per_label   jsonb       not null default '{}'::jsonb,  -- { en, sq } e.g. one-time
  features    jsonb       not null default '[]'::jsonb,  -- [ { en, sq }, ... ]
  highlighted boolean     not null default false,
  sort_order  integer     not null default 0,
  published   boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid        references auth.users (id) on delete set null
);

create index if not exists pricing_plans_published_sort_idx
  on public.pricing_plans (published, sort_order);

drop trigger if exists pricing_plans_set_updated_at on public.pricing_plans;
create trigger pricing_plans_set_updated_at
  before update on public.pricing_plans
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- site_sections: reusable, toggleable content blocks (work/contact/suit/...).
-- content shape is section-specific; kept as free-form jsonb.
-- ---------------------------------------------------------------------------
create table if not exists public.site_sections (
  id         uuid        primary key default gen_random_uuid(),
  slug       text        not null unique,
  enabled    boolean     not null default true,
  sort_order integer     not null default 0,
  content    jsonb       not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid        references auth.users (id) on delete set null
);

create index if not exists site_sections_enabled_sort_idx
  on public.site_sections (enabled, sort_order);

drop trigger if exists site_sections_set_updated_at on public.site_sections;
create trigger site_sections_set_updated_at
  before update on public.site_sections
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: admins have full CRUD; the public may read only what is published/enabled.
-- ---------------------------------------------------------------------------
alter table public.site_settings     enable row level security;
alter table public.showcase_projects enable row level security;
alter table public.pricing_plans     enable row level security;
alter table public.site_sections     enable row level security;

-- site_settings — public reads the single row; admins write it.
drop policy if exists "public reads settings" on public.site_settings;
create policy "public reads settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "admins write settings" on public.site_settings;
create policy "admins write settings"
  on public.site_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- showcase_projects
drop policy if exists "public reads published showcase" on public.showcase_projects;
create policy "public reads published showcase"
  on public.showcase_projects for select
  to anon, authenticated
  using (published);

drop policy if exists "admins manage showcase" on public.showcase_projects;
create policy "admins manage showcase"
  on public.showcase_projects for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- pricing_plans
drop policy if exists "public reads published pricing" on public.pricing_plans;
create policy "public reads published pricing"
  on public.pricing_plans for select
  to anon, authenticated
  using (published);

drop policy if exists "admins manage pricing" on public.pricing_plans;
create policy "admins manage pricing"
  on public.pricing_plans for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- site_sections
drop policy if exists "public reads enabled sections" on public.site_sections;
create policy "public reads enabled sections"
  on public.site_sections for select
  to anon, authenticated
  using (enabled);

drop policy if exists "admins manage sections" on public.site_sections;
create policy "admins manage sections"
  on public.site_sections for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
