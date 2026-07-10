# Database migrations

Versioned SQL for the CRM backend (Phase 1 schema + Phase 2 RLS). Apply the
files **in ascending numeric order**, after the base `backend/db/reviews.sql`.

| File | Adds |
|---|---|
| `0001_admin_and_helpers.sql` | `admin_profiles`, `is_admin()` guard, shared `set_updated_at()` |
| `0002_clients.sql` | `clients` + indexes, admin RLS |
| `0003_crm_projects.sql` | `crm_projects` (denormalized `total_cost`), admin RLS |
| `0004_project_costs.sql` | `project_costs` + trigger that syncs `crm_projects.total_cost`, admin RLS |
| `0005_contact_submissions.sql` | versions + extends existing `contact_submissions` (package, status, client_id), anon insert + admin RLS |
| `0006_cms.sql` | `site_settings`, `showcase_projects`, `pricing_plans`, `site_sections` (bilingual `{en,sq}` jsonb), public-read + admin RLS |
| `0007_public_site_content_view.sql` | `public_site_content` aggregated view for `GET /api/content/public` |
| `0008_reviews_admin_rls.sql` | admin moderation policies on `reviews` (moves moderation off `ADMIN_TOKEN`) |

Every file is idempotent — safe to re-run (`create ... if not exists`,
`add column if not exists`, `drop policy if exists` before `create policy`).

## How to apply

**Supabase SQL editor** — paste each file in order and run.

**Supabase CLI** — copy the files into `supabase/migrations/` (or point the CLI
at this folder) and `supabase db push`.

## RLS model

- **anon** — may `INSERT` into `reviews` and `contact_submissions`; may `SELECT`
  published CMS rows (and the `public_site_content` view).
- **authenticated + in `admin_profiles`** — full CRUD on all CRM + CMS tables,
  gated by `is_admin()`.
- **service role** (the Express backend) — bypasses RLS; used server-side only.

## Seeding the first admin

RLS only lets existing admins add admins, so bootstrap the first one manually:

1. Supabase Dashboard → **Authentication → Users → Add user** (email + password).
2. Copy that user's UUID.
3. Run, replacing the UUID:

   ```sql
   insert into public.admin_profiles (user_id, display_name)
   values ('00000000-0000-0000-0000-000000000000', 'Owner');
   ```

That account can now pass `is_admin()` and, once the CRM API ships, add teammates.
