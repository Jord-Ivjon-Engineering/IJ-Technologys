'use strict';

const express = require('express');
const { getFinanceSummary } = require('../../lib/crmStore');

const router = express.Router();

router.get('/summary', async (req, res, next) => {
  try {
    const summary = await getFinanceSummary();
    res.json({ ok: true, summary });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
