'use strict';

const express = require('express');
const { getPublicContent } = require('../lib/crmStore');

const router = express.Router();

router.get('/public', async (req, res, next) => {
  try {
    const data = await getPublicContent();
    const { version, ...content } = data;
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.json({ ok: true, version, content });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
