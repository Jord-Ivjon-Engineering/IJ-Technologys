'use strict';

/**
 * POST /api/contact
 * Validates a contact submission and persists it via the store.
 * Returns { ok:true } on success, or { ok:false, fields:[...] } on validation error.
 */
const express = require('express');
const { saveSubmission } = require('../lib/store');
const { sendLeadNotification } = require('../lib/mailer');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 100, email: 160, message: 2000 };

function validate(body) {
  const fields = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > LIMITS.name) fields.push('name');
  if (!EMAIL_RE.test(email) || email.length > LIMITS.email) fields.push('email');
  if (message.length < 10 || message.length > LIMITS.message) fields.push('message');

  return { fields, clean: { name, email, message } };
}

router.post('/', async (req, res, next) => {
  try {
    const { fields, clean } = validate(req.body || {});
    if (fields.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields });
    }

    const submission = {
      ...clean,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      receivedAt: new Date().toISOString(),
    };
    await saveSubmission(submission);
    console.log(`New contact submission from ${clean.email}`);

    /* Notify the studio inbox. Best-effort: the lead is already saved, so a
       mail failure must not fail the request or lose the submission. */
    sendLeadNotification(submission).catch((err) =>
      console.error('[contact] lead notification error:', err)
    );

    return res.status(201).json({ ok: true, message: 'Submission received.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
