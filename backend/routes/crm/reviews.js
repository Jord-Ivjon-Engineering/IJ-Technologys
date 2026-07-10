'use strict';

const express = require('express');
const { readReviews, updateReview, deleteReview } = require('../../lib/store');

const router = express.Router();

function toModeration(r) {
  return {
    id: r.id,
    name: r.name,
    role: r.role,
    text: r.text,
    rating: r.rating,
    approved: r.approved,
    createdAt: r.createdAt,
    approvedAt: r.approvedAt,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const status = (req.query.status || 'all').toLowerCase();
    const all = await readReviews();
    let reviews = all;

    if (status === 'pending') {
      reviews = all.filter((r) => !r.approved);
    } else if (status === 'approved') {
      reviews = all.filter((r) => r.approved);
    }

    reviews = reviews.slice().reverse().map(toModeration);
    res.json({ ok: true, reviews });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    const patch = {};

    if (body.approved !== undefined) {
      patch.approved = Boolean(body.approved);
      patch.approvedAt = patch.approved ? new Date().toISOString() : null;
    }

    if (!Object.keys(patch).length) {
      return res.status(400).json({ ok: false, error: 'No valid fields to update.' });
    }

    const updated = await updateReview(req.params.id, patch);
    if (!updated) return res.status(404).json({ ok: false, error: 'Review not found.' });
    res.json({ ok: true, review: toModeration(updated) });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const updated = await updateReview(req.params.id, {
      approved: true,
      approvedAt: new Date().toISOString(),
    });
    if (!updated) return res.status(404).json({ ok: false, error: 'Review not found.' });
    res.json({ ok: true, review: toModeration(updated) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await deleteReview(req.params.id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Review not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
