-- 0005_contact_submissions.sql
-- Versions the contact_submissions table (which already exists in the live
-- project, created ad hoc) and extends it for the CRM inbox: package interest,
-- a triage status, and an optional link to the client it converted into.
--
-- Written to be safe against the existing table: CREATE IF NOT EXISTS matches
-- the current shape, and every new column is ADD COLUMN IF NOT EXISTS.

create table if not exists public.contact_submissions (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  email       text        not null,
  message     text        not null,
  ip          text,
  user_agent  text,
  received_at timestamptz not null default now()
);

-- New CRM columns (no-ops if this migration is re-run or the columns exist).
alter table public.contact_submissions
  add column if not exists package   text,
  add column if not exists status    text not null default 'new',
  add column if not exists client_id uuid references public.clients (id) on delete set null;

-- Constrain status to the triage lifecycle. ADD CONSTRAINT has no IF NOT EXISTS,
-- so guard on the catalog to stay idempotent.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.contact_submissions'::regclass
       and conname  = 'contact_submissions_status_check'
  ) then
    alter table public.contact_submissions
      add constraint contact_submissions_status_check
      check (status in ('new', 'read', 'replied', 'converted', 'archived'));
  end if;
end$$;

-- Inbox ordering: unhandled first-ish, newest first.
create index if not exists contact_submissions_status_received_idx
  on public.contact_submissions (status, received_at desc);

-- ---------------------------------------------------------------------------
-- RLS: the public may drop a message in the box; only admins can read/triage.
-- (The Express backend currently inserts with the service-role key, which
-- bypasses RLS — this anon policy documents intent and enables a future direct
-- client insert.)
-- ---------------------------------------------------------------------------
alter table public.contact_submissions enable row level security;

drop policy if exists "anyone can submit contact" on public.contact_submissions;
create policy "anyone can submit contact"
  on public.contact_submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "admins read contact" on public.contact_submissions;
create policy "admins read contact"
  on public.contact_submissions for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins update contact" on public.contact_submissions;
create policy "admins update contact"
  on public.contact_submissions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete contact" on public.contact_submissions;
create policy "admins delete contact"
  on public.contact_submissions for delete
  to authenticated
  using (public.is_admin());
