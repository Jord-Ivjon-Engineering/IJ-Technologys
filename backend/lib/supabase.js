'use strict';

/**
 * Server-side Supabase client.
 *
 * Uses the SERVICE ROLE key, which bypasses Row Level Security — this is safe
 * because the client only ever runs on the backend, never in the browser.
 * It lets the API read pending reviews and moderate (approve/delete) them.
 *
 * Required env vars (see .env.example):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
      '(copy backend/.env.example to .env and fill it in).'
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = { supabase };
