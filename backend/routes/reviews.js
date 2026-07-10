'use strict';

const express = require('express');
const { saveReview, readReviews } = require('../lib/store');

const router = express.Router();

const LIMITS = { name: 80, role: 80, text: 600 };
const MAX_PUBLIC = 60;
const MIN_PUBLIC_RATING = 4;

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

function toPublic(r) {
  return { id: r.id, name: r.name, role: r.role, text: r.text, rating: r.rating, createdAt: r.createdAt };
}

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
    const autoPublish = data.rating >= MIN_PUBLIC_RATING;
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

module.exports = router;
