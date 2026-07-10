'use strict';

const express = require('express');
const { createSignedUploadUrl } = require('../../lib/crmStore');

const router = express.Router();

router.post('/upload', async (req, res, next) => {
  try {
    const filename = req.body?.filename;
    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({ ok: false, error: 'filename required.' });
    }
    const upload = await createSignedUploadUrl(filename);
    res.json({ ok: true, upload });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
