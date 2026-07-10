'use strict';

const express = require('express');
const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require('../../lib/crmStore');

const router = express.Router();

const STATUSES = new Set(['lead', 'active', 'past']);

function validateClient(body, partial) {
  const fields = [];
  const out = {};

  if (!partial || body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 1 || name.length > 200) fields.push('name');
    else out.name = name;
  }

  if (!partial || body.email !== undefined) {
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (email.length < 3 || email.length > 200) fields.push('email');
    else out.email = email;
  }

  if (body.company !== undefined) {
    out.company = typeof body.company === 'string' ? body.company.trim().slice(0, 200) : '';
  }
  if (body.phone !== undefined) {
    out.phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 40) : '';
  }
  if (body.source !== undefined) {
    out.source = typeof body.source === 'string' ? body.source.trim().slice(0, 120) : '';
  }
  if (body.notes !== undefined) {
    out.notes = typeof body.notes === 'string' ? body.notes : '';
  }
  if (body.status !== undefined) {
    if (!STATUSES.has(body.status)) fields.push('status');
    else out.status = body.status;
  }

  return { fields, data: out };
}

router.get('/', async (req, res, next) => {
  try {
    const clients = await listClients();
    res.json({ ok: true, clients });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const client = await getClient(req.params.id);
    if (!client) return res.status(404).json({ ok: false, error: 'Client not found.' });
    res.json({ ok: true, client });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { fields, data } = validateClient(req.body || {}, false);
    if (fields.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields });
    }
    const client = await createClient(data);
    res.status(201).json({ ok: true, client });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { fields, data } = validateClient(req.body || {}, true);
    if (fields.length) {
      return res.status(400).json({ ok: false, error: 'Validation failed.', fields });
    }
    const client = await updateClient(req.params.id, data);
    if (!client) return res.status(404).json({ ok: false, error: 'Client not found.' });
    res.json({ ok: true, client });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await deleteClient(req.params.id);
    if (!removed) return res.status(404).json({ ok: false, error: 'Client not found.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
