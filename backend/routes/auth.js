'use strict';

const express = require('express');
const { getAuthClient, tokenHasExpectedAudience } = require('../lib/auth');
const { resolveUserRole } = require('../lib/userRoles');

const router = express.Router();

router.get('/config', (req, res) => {
  const url = process.env.SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) {
    return res.status(503).json({ ok: false, error: 'Auth is not configured.' });
  }
  res.json({ ok: true, supabaseUrl: url, supabaseAnonKey: anonKey });
});

async function bearerUser(req) {
  const header = req.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  if (!tokenHasExpectedAudience(token)) return null;
  const client = getAuthClient();
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

router.get('/me', async (req, res, next) => {
  try {
    const user = await bearerUser(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    const role = await resolveUserRole(user.id);
    if (!role) {
      return res.status(403).json({ ok: false, error: 'No account access configured.' });
    }
    res.json({ ok: true, user: { id: user.id, email: user.email }, ...role });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
