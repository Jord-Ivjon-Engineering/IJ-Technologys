-- 0008_reviews_admin_rls.sql
-- Bring the existing reviews table (see backend/db/reviews.sql) under the same
-- admin model as the rest of the CRM, so review moderation can move from the
-- shared ADMIN_TOKEN to Supabase Auth JWTs (Phase 6).
--
-- reviews.sql already: created the table, enabled RLS, added the anon INSERT
-- policy, and created the public_reviews view. This migration only ADDS admin
-- moderation policies; it does not alter or duplicate that setup.
--
-- Requires: backend/db/reviews.sql and 0001_admin_and_helpers.sql applied first.

-- Admins can see every review, including pending and low-rated ones the public
-- view hides.
drop policy if exists "admins read all reviews" on public.reviews;
create policy "admins read all reviews"
  on public.reviews for select
  to authenticated
  using (public.is_admin());

-- Admins approve/edit reviews.
drop policy if exists "admins update reviews" on public.reviews;
create policy "admins update reviews"
  on public.reviews for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admins reject/remove reviews.
drop policy if exists "admins delete reviews" on public.reviews;
create policy "admins delete reviews"
  on public.reviews for delete
  to authenticated
  using (public.is_admin());
