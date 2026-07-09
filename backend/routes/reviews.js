'use strict';

/**
 * Client reviews API (with moderation).
 *
 *  Public:
 *   GET  /api/reviews            → { ok, reviews:[...] } APPROVED only, newest first
 *   POST /api/reviews            → submit a review (stored as pending, not shown yet)
 *
 *  Owner only (Authorization: Bearer <ADMIN_TOKEN>  or  ?token=<ADMIN_TOKEN>):
 *   GET    /api/reviews/pending      → reviews awaiting approval
 *   POST   /api/reviews/:id/approve  → publish a review
 *   DELETE /api/reviews/:id          → reject/remove a review
 *
 * Text is stored raw and escaped on render by the frontend; we also strip
 * angle brackets here as defense in depth.
 */
const express = require('express');
const { saveReview, readReviews, updateReview, deleteReview } = require('../lib/store');

const router = express.Router();

const LIMITS = { name: 80, role: 80, text: 600 };
const MAX_PUBLIC = 60;
const MIN_PUBLIC_RATING = 4; // reviews below this are stored but never shown publicly
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'ijt-dev-admin';
if (!process.env.ADMIN_TOKEN) {
  console.warn('[reviews] ADMIN_TOKEN not set — using insecure dev token "ijt-dev-admin". Set ADMIN_TOKEN in production.');
}

function clean(str) {
  return typeof str === 'string' ? str.replace(/[<>]/g, '').trim() : '';
}

function validate(body) {
  const fields = [];
  const name = clean(body.name);
  const role = clean(body.role);
  const text = clean(body.text);
  const rating = Number.parseInt(body.rating, 10);

  if (name.length < 2 || name.length > LIMITS.name) fields.push('name');
  if (role.length > LIMITS.role) fields.push('role');
  if (text.length < 10 || text.length > LIMITS.text) fields.push('text');
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) fields.push('rating');

  return { fields, data: { name, role, text, rating } };
}

/* public shape sent to the browser (no IP / user-agent) */
function toPublic(r) {
  return { id: r.id, name: r.name, role: r.role, text: r.text, rating: r.rating, createdAt: r.createdAt };
}

function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim() || (req.query.token || '').trim();
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

/* ---- public ---- */
router.get('/', async (req, res, next) => {
  try {
    const all = await readReviews();
    const reviews = all
      .filter((r) => r.approved && r.rating >= MIN_PUBLIC_RATING)
      .reverse()
      .slice(0, MAX_PUBLIC)
      .map(toPublic);
    res.json({ ok: true, reviews });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { fields, data } = validate(req.body || {});
    if (fields.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields });
    }

    const now = new Date().toISOString();
    const autoPublish = data.rating >= MIN_PUBLIC_RATING; // 4★+ go live immediately, no approval
    const saved = await saveReview({
      ...data,
      approved: autoPublish,
      approvedAt: autoPublish ? now : null,
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      createdAt: now,
    });

    console.log(`New review from ${data.name} (${data.rating}★) — ${autoPublish ? 'published' : 'held for moderation'}`);
    return res.status(201).json({
      ok: true,
      published: autoPublish,
      review: autoPublish ? toPublic(saved) : undefined,
      message: autoPublish ? 'Review published.' : 'Review received and awaiting approval.',
    });
  } catch (err) {
    next(err);
  }
});

/* ---- owner only ---- */
router.get('/pending', requireAdmin, async (req, res, next) => {
  try {
    const all = await readReviews();
    const pending = all.filter((r) => !r.approved).reverse().map(toPublic);
    res.json({ ok: true, reviews: pending });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const updated = await updateReview(req.params.id, { approved: true, approvedAt: new Date().toISOString() });
    if (!updated) return res.status(404).json({ ok: false, error: 'Review not found.' });
    res.json({ ok: true, review: toPublic(updated) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const removed = await deleteReview(req.params.id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Review not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
