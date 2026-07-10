'use strict';

const express = require('express');
const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require('../../lib/crmStore');

const router = express.Router();

const STATUSES = new Set(['inquiry', 'scoping', 'active', 'review', 'done', 'maintenance']);

function validateProject(body, partial) {
  const fields = [];
  const out = {};

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 1 || name.length > 200) fields.push('name');
    else out.name = name;
  }

  if (body.clientId !== undefined) {
    out.clientId = body.clientId || null;
  }
  if (body.status !== undefined) {
    if (!STATUSES.has(body.status)) fields.push('status');
    else out.status = body.status;
  }
  if (body.packageTier !== undefined) {
    out.packageTier = typeof body.packageTier === 'string' ? body.packageTier.trim().slice(0, 40) : '';
  }
  if (body.quotedAmount !== undefined) {
    const n = Number(body.quotedAmount);
    if (!Number.isFinite(n) || n < 0) fields.push('quotedAmount');
    else out.quotedAmount = n;
  }
  if (body.agreedRevenue !== undefined) {
    const n = Number(body.agreedRevenue);
    if (!Number.isFinite(n) || n < 0) fields.push('agreedRevenue');
    else out.agreedRevenue = n;
  }
  if (body.startDate !== undefined) out.startDate = body.startDate || null;
  if (body.dueDate !== undefined) out.dueDate = body.dueDate || null;
  if (body.showcaseFeatured !== undefined) out.showcaseFeatured = Boolean(body.showcaseFeatured);
  if (body.notes !== undefined) out.notes = typeof body.notes === 'string' ? body.notes : '';

  return { fields, data: out };
}

router.get('/', async (req, res, next) => {
  try {
    const includeCosts = req.query.include === 'costs';
    const projects = await listProjects(includeCosts);
    res.json({ ok: true, projects });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const includeCosts = req.query.include === 'costs';
    const project = await getProject(req.params.id, includeCosts);
    if (!project) return res.status(404).json({ ok: false, error: 'Project not found.' });
    res.json({ ok: true, project });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { fields, data } = validateProject(req.body || {}, false);
    if (fields.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields });
    }
    const project = await createProject(data);
    res.status(201).json({ ok: true, project });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { fields, data } = validateProject(req.body || {}, true);
    if (fields.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields });
    }
    const project = await updateProject(req.params.id, data);
    if (!project) return res.status(404).json({ ok: false, error: 'Project not found.' });
    res.json({ ok: true, project });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await deleteProject(req.params.id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Project not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
