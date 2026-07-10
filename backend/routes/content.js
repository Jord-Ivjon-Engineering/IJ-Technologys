'use strict';

const express = require('express');
const { getPublicContent } = require('../lib/crmStore');

const router = express.Router();

router.get('/public', async (req, res, next) => {
  try {
    const content = await getPublicContent();
    res.json({ ok: true, content });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
