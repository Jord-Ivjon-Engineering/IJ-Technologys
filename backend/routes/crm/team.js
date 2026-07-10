'use strict';

const express = require('express');
const { listTeam } = require('../../lib/crmStore');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const team = await listTeam();
    res.json({ ok: true, team });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
