'use strict';

const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

let authClient = null;

function getAuthClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY for JWT verification.');
  }
  if (!authClient) {
    authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return authClient;
}

function getExpectedJwtAudience() {
  const raw = process.env.CRM_JWT_AUDIENCE;
  if (raw === '') return null;
  return raw || 'authenticated';
}

function tokenHasExpectedAudience(token) {
  const expected = getExpectedJwtAudience();
  if (!expected) return true;
  try {
    const parts = String(token).split('.');
    if (parts.length < 2) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    const aud = payload.aud;
    if (Array.isArray(aud)) return aud.includes(expected);
    return aud === expected;
  } catch {
    return false;
  }
}

module.exports = { getAuthClient, getExpectedJwtAudience, tokenHasExpectedAudience };
