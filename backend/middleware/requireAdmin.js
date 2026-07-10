'use strict';

const { supabase } = require('../lib/supabase');
const { getAuthClient, tokenHasExpectedAudience } = require('../lib/auth');

async function requireAdmin(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    if (!tokenHasExpectedAudience(token)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const client = getAuthClient();
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('user_id, display_name, created_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    req.adminUser = user;
    req.adminProfile = profile;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAdmin };
