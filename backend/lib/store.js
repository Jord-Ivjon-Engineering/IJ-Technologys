'use strict';

/**
 * Data store backed by Supabase (Postgres).
 *
 * Keeps the same camelCase interface the routes already use; column names in
 * the database are snake_case, so we translate at this boundary.
 *
 * Tables:
 *   reviews              — client reviews (moderated; shown only when approved & >= 4★)
 *   contact_submissions  — contact form messages
 */
const { supabase } = require('./supabase');

/* ---- row <-> app-object translation ---- */

function reviewFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    text: row.text,
    rating: row.rating,
    approved: row.approved,
    ip: row.ip,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    approvedAt: row.approved_at,
  };
}

function reviewToRow(item) {
  const row = {};
  if (item.name !== undefined) row.name = item.name;
  if (item.role !== undefined) row.role = item.role;
  if (item.text !== undefined) row.text = item.text;
  if (item.rating !== undefined) row.rating = item.rating;
  if (item.approved !== undefined) row.approved = item.approved;
  if (item.ip !== undefined) row.ip = item.ip;
  if (item.userAgent !== undefined) row.user_agent = item.userAgent;
  if (item.createdAt !== undefined) row.created_at = item.createdAt;
  if (item.approvedAt !== undefined) row.approved_at = item.approvedAt;
  return row;
}

/* ---- contact submissions ---- */

async function saveSubmission(item) {
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert({
      name: item.name,
      email: item.email,
      message: item.message,
      package: item.package || '',
      status: 'new',
      ip: item.ip,
      user_agent: item.userAgent,
      received_at: item.receivedAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ---- client reviews ---- */

async function saveReview(item) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewToRow(item))
    .select()
    .single();
  if (error) throw error;
  return reviewFromRow(data);
}

async function readReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data.map(reviewFromRow);
}

async function readPublicReviews() {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, name, role, text, rating, created_at')
    .eq('approved', true)
    .gte('rating', 4)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error) throw error;
  return data.map(reviewFromRow);
}

async function updateReview(id, patch) {
  const { data, error } = await supabase
    .from('reviews')
    .update(reviewToRow(patch))
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return reviewFromRow(data); // null when no row matched
}

async function deleteReview(id) {
  const { data, error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  return Boolean(data); // false when no row matched
}

module.exports = { saveSubmission, saveReview, readReviews, readPublicReviews, updateReview, deleteReview };
