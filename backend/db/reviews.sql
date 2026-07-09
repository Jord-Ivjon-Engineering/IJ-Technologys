-- IJ Technologys — reviews table (Postgres / Supabase)
--
-- Run this in the Supabase SQL editor (or `supabase db push`) to create the
-- table that backs /api/reviews. A review is only shown publicly when it is
-- both approved AND rated 4 stars or higher — see the `public_reviews` view.

create table if not exists public.reviews (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null check (char_length(name) between 2 and 80),
  role        text        not null default '' check (char_length(role) <= 80),
  text        text        not null check (char_length(text) between 10 and 600),
  rating      smallint    not null check (rating between 1 and 5),
  approved    boolean     not null default false,
  ip          text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  approved_at timestamptz
);

-- Speeds up the public listing (approved + high-rated, newest first).
create index if not exists reviews_public_idx
  on public.reviews (created_at desc)
  where approved and rating >= 4;

-- The only reviews the public site should read: approved and >= 4 stars.
-- Below-4-star reviews are stored (so the owner can still see them) but never
-- surfaced through this view.
create or replace view public.public_reviews as
  select id, name, role, text, rating, created_at
  from public.reviews
  where approved and rating >= 4
  order by created_at desc;

-- Row Level Security: lock the base table down, expose only what's needed.
alter table public.reviews enable row level security;

-- Anyone may submit a review (it lands unapproved and hidden until moderated).
create policy "anon can insert reviews"
  on public.reviews for insert
  to anon, authenticated
  with check (true);

-- No direct public SELECT on the base table; reads go through public_reviews,
-- and moderation happens via the service-role key on the backend.
