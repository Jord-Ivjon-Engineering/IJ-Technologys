'use strict';

const express = require('express');
const {
  listSubmissions,
  getSubmission,
  updateSubmission,
  convertSubmissionToClient,
} = require('../../lib/crmStore');

const router = express.Router();

const STATUSES = new Set(['new', 'read', 'replied', 'converted', 'archived']);

router.get('/', async (req, res, next) => {
  try {
    const submissions = await listSubmissions();
    res.json({ ok: true, submissions });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const submission = await getSubmission(req.params.id);
    if (!submission) return res.status(404).json({ ok: false, error: 'Submission not found.' });
    res.json({ ok: true, submission });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const body = req.body || {};
    const patch = {};

    if (body.status !== undefined) {
      if (!STATUSES.has(body.status)) {
        return res.status(400).json({ ok: false, error: 'Validation failed.', fields: ['status'] });
      }
      patch.status = body.status;
    }
    if (body.clientId !== undefined) patch.clientId = body.clientId || null;

    if (!Object.keys(patch).length) {
      return res.status(400).json({ ok: false, error: 'No valid fields to update.' });
    }

    const submission = await updateSubmission(req.params.id, patch);
    if (!submission) return res.status(404).json({ ok: false, error: 'Submission not found.' });
    res.json({ ok: true, submission });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/convert', async (req, res, next) => {
  try {
    const result = await convertSubmissionToClient(req.params.id);
    if (!result) return res.status(404).json({ ok: false, error: 'Submission not found.' });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
