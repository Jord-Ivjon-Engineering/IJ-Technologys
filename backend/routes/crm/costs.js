'use strict';

const express = require('express');
const {
  listCosts,
  createCost,
  updateCost,
  deleteCost,
} = require('../../lib/crmStore');

const router = express.Router();

const CATEGORIES = new Set(['hosting', 'tools', 'contractor', 'other']);

function validateCost(body, partial) {
  const fields = [];
  const out = {};

  if (!partial || body.projectId !== undefined) {
    if (!body.projectId) fields.push('projectId');
    else out.projectId = body.projectId;
  }

  if (!partial || body.label !== undefined) {
    const label = typeof body.label === 'string' ? body.label.trim() : '';
    if (label.length < 1 || label.length > 200) fields.push('label');
    else out.label = label;
  }

  if (!partial || body.amount !== undefined) {
    const n = Number(body.amount);
    if (!Number.isFinite(n) || n < 0) fields.push('amount');
    else out.amount = n;
  }

  if (body.category !== undefined) {
    if (!CATEGORIES.has(body.category)) fields.push('category');
    else out.category = body.category;
  }

  if (body.incurredAt !== undefined) out.incurredAt = body.incurredAt;

  return { fields, data: out };
}

router.get('/', async (req, res, next) => {
  try {
    const costs = await listCosts(req.query.projectId);
    res.json({ ok: true, costs });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { fields, data } = validateCost(req.body || {}, false);
    if (fields.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields });
    }
    const cost = await createCost(data);
    res.status(201).json({ ok: true, cost });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { fields, data } = validateCost(req.body || {}, true);
    if (fields.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields });
    }
    const cost = await updateCost(req.params.id, data);
    if (!cost) return res.status(404).json({ ok: false, error: 'Cost not found.' });
    res.json({ ok: true, cost });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await deleteCost(req.params.id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Cost not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
